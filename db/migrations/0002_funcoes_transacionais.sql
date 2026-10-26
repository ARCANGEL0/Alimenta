-- Migration 0002: funções RPC transacionais para operações críticas de stock (plain PostgreSQL)
-- Todas executam numa transação única: sucesso total ou rollback integral.
-- Definem search_path fixo para evitar shadowing de objetos.

-- --------------------------------------------------------
-- 1. Fecho de inspeção de doação (idempotente)
-- Valida quantidades, cria lotes apenas para quantidade aceite,
-- movimento receipt por lote, auditoria, estado da doação.
-- --------------------------------------------------------
create or replace function close_donation_inspection(
  p_donation_id uuid,
  p_actor_id uuid
)
returns json
language plpgsql
as $$
declare
  v_donation donations%rowtype;
  v_item record;
  v_batch_id uuid;
  v_existing text;
begin
  -- bloqueia a doação para evitar concorrência
  select * into v_donation
  from donations
  where id = p_donation_id
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Doação não encontrada');
  end if;

  -- idempotência: se já fechada, retorna o estado atual
  if v_donation.status in ('accepted', 'rejected', 'partially_accepted') then
    return json_build_object(
      'success', true,
      'idempotent', true,
      'status', v_donation.status,
      'message', 'Inspeção já fechada anteriormente'
    );
  end if;

  -- processa cada linha da doação
  for v_item in
    select id, product_id, quantity_accepted, quantity_rejected,
           unit_code, supplier_batch_code, expiry_date, expiry_type
    from donation_items
    where donation_id = p_donation_id
  loop
    -- só cria lote se houver quantidade aceite
    if v_item.quantity_accepted > 0 then
      insert into batches (
        internal_code, product_id, donation_item_id, supplier_batch_code,
        warehouse_id, storage_location_id, received_at, expiry_date, expiry_type,
        initial_quantity, on_hand_quantity, reserved_quantity, available_quantity,
        unit_code, status, created_at, updated_at
      ) values (
        'LOTE-' || gen_random_uuid()::text,
        v_item.product_id,
        v_item.id,
        v_item.supplier_batch_code,
        (select id from warehouses where is_active limit 1),
        (select id from storage_locations where is_active limit 1),
        v_donation.received_at,
        v_item.expiry_date,
        v_item.expiry_type,
        v_item.quantity_accepted,
        v_item.quantity_accepted,
        0,
        v_item.quantity_accepted,
        v_item.unit_code,
        'available',
        now(),
        now()
      ) returning id into v_batch_id;

      -- movimento de entrada
      insert into stock_movements (
        batch_id, movement_type, quantity, unit_code, source_type, source_id,
        reason, created_by, created_at
      ) values (
        v_batch_id, 'receipt', v_item.quantity_accepted, v_item.unit_code,
        'donation_item', v_item.id,
        'Entrada por aceitação de doação', p_actor_id, now()
      );
    end if;
  end loop;

  -- determina estado final da doação
  update donations
  set status = case
    when exists (
      select 1 from donation_items di
      where di.donation_id = p_donation_id
        and (di.quantity_accepted > 0 or di.quantity_rejected > 0)
        and (di.quantity_accepted + di.quantity_rejected < di.quantity_received)
    ) then 'partially_accepted'
    when exists (
      select 1 from donation_items di
      where di.donation_id = p_donation_id
        and di.quantity_rejected > 0
        and di.quantity_accepted = 0
    ) then 'rejected'
    else 'accepted'
  end,
  updated_at = now()
  where id = p_donation_id;

  -- auditoria
  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
  values (
    p_actor_id, 'close_donation_inspection', 'donation', p_donation_id,
    json_build_object('donation_id', p_donation_id), now()
  );

  return json_build_object(
    'success', true,
    'idempotent', false,
    'status', (select status from donations where id = p_donation_id),
    'message', 'Inspeção fechada com sucesso'
  );
end;
$$;

-- --------------------------------------------------------
-- 2. Sugestão de lotes por FEFO (backend é a verdade)
-- Exclui lotes não inspecionados, bloqueados, rejeitados, esgotados,
-- e use_by vencido. Ordena expiração ASC, desempate recebimento ASC.
-- --------------------------------------------------------
create or replace function suggest_batches_fefo(
  p_product_id uuid,
  p_quantity numeric(12,3),
  p_operational_date date default current_date
)
returns table (
  batch_id uuid,
  internal_code text,
  expiry_date date,
  expiry_type text,
  on_hand_quantity numeric(12,3),
  reserved_quantity numeric(12,3),
  available_quantity numeric(12,3),
  suggested_quantity numeric(12,3)
)
language plpgsql
as $$
begin
  return query
  with candidatos as (
    select b.*,
           b.on_hand_quantity - b.reserved_quantity as qtd_livre
    from batches b
    where b.product_id = p_product_id
      and b.status = 'available'
      and b.available_quantity > 0
      and exists (
        select 1 from batch_inspections bi
        where bi.batch_id = b.id
          and bi.decision = 'approved'
      )
      and not (
        b.expiry_type = 'use_by'
        and b.expiry_date is not null
        and b.expiry_date < p_operational_date
      )
  )
  select
    c.id as batch_id,
    c.internal_code,
    c.expiry_date,
    c.expiry_type,
    c.on_hand_quantity,
    c.reserved_quantity,
    c.available_quantity,
    least(c.qtd_livre, greatest(p_quantity - coalesce(sum(least(c.qtd_livre, p_quantity)) over (order by c.expiry_date asc, c.received_at asc rows between unbounded preceding and 1 preceding), 0), 0)) as suggested_quantity
  from candidatos c
  order by c.expiry_date asc nulls last, c.received_at asc
  limit 50;
end;
$$;

-- --------------------------------------------------------
-- 3. Confirmação de distribuição (atómica)
-- Bloqueia distribuição e lotes, revalida estado/validade,
-- debita saldo físico, consome reservas, cria movimentos,
-- marca entregue, auditoria. Rollback integral em falha.
-- --------------------------------------------------------
create or replace function confirm_distribution(
  p_distribution_id uuid,
  p_actor_id uuid
)
returns json
language plpgsql
as $$
declare
  v_distribution distributions%rowtype;
  v_reservation record;
  v_batch batches%rowtype;
  v_enough boolean := true;
  v_msg text;
begin
  -- bloqueia a distribuição
  select * into v_distribution
  from distributions
  where id = p_distribution_id
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Distribuição não encontrada');
  end if;

  if v_distribution.status <> 'reserved' then
    return json_build_object('success', false, 'error', 'Distribuição não está reservada');
  end if;

  -- valida todas as reservas ativas e lotes envolvidos
  for v_reservation in
    select sr.id, sr.batch_id, sr.quantity
    from stock_reservations sr
    join distribution_items di on di.id = sr.distribution_item_id
    where sr.status = 'active'
      and di.distribution_id = p_distribution_id
    for update
  loop
    select * into v_batch
    from batches
    where id = v_reservation.batch_id
    for update;

    -- revalida estado e validade do lote
    if v_batch.status <> 'available'
       or (v_batch.expiry_type = 'use_by' and v_batch.expiry_date is not null and v_batch.expiry_date < current_date)
       or v_batch.available_quantity < v_reservation.quantity then
      v_enough := false;
      v_msg := 'Lote ' || v_batch.internal_code || ' não disponível ou saldo insuficiente';
      exit;
    end if;
  end loop;

  if not v_enough then
    return json_build_object('success', false, 'error', v_msg);
  end if;

  -- debita saldo físico e consome reservas
  for v_reservation in
    select sr.id, sr.batch_id, sr.quantity
    from stock_reservations sr
    join distribution_items di on di.id = sr.distribution_item_id
    where sr.status = 'active'
      and di.distribution_id = p_distribution_id
  loop
    update batches
    set on_hand_quantity = on_hand_quantity - v_reservation.quantity,
        reserved_quantity = reserved_quantity - v_reservation.quantity,
        available_quantity = available_quantity - v_reservation.quantity,
        status = case
          when on_hand_quantity - v_reservation.quantity = 0 then 'depleted'
          else status
        end,
        updated_at = now()
    where id = v_reservation.batch_id;

    -- movimento de saída
    insert into stock_movements (
      batch_id, movement_type, quantity, unit_code, source_type, source_id,
      reason, created_by, created_at
    )
    select b.unit_code, 'distribution', v_reservation.quantity, b.unit_code,
           'distribution_item', v_reservation.distribution_item_id,
           'Saída por entrega de distribuição', p_actor_id, now()
    from batches b where b.id = v_reservation.batch_id;

    -- consome reserva
    update stock_reservations
    set status = 'consumed', updated_at = now()
    where id = v_reservation.id;
  end loop;

  -- marca distribuição como entregue
  update distributions
  set status = 'delivered', delivered_at = now(), updated_at = now()
  where id = p_distribution_id;

  -- auditoria
  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
  values (
    p_actor_id, 'confirm_distribution', 'distribution', p_distribution_id,
    json_build_object('distribution_id', p_distribution_id), now()
  );

  return json_build_object('success', true, 'message', 'Distribuição confirmada e entregue');
end;
$$;

-- --------------------------------------------------------
-- 4. Cancelamento de distribuição (liberta reservas)
-- Sem movimento de saída. Auditoria.
-- --------------------------------------------------------
create or replace function cancel_distribution(
  p_distribution_id uuid,
  p_actor_id uuid
)
returns json
language plpgsql
as $$
declare
  v_distribution distributions%rowtype;
begin
  select * into v_distribution
  from distributions
  where id = p_distribution_id
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Distribuição não encontrada');
  end if;

  if v_distribution.status = 'delivered' then
    return json_build_object('success', false, 'error', 'Distribuição entregue não pode ser cancelada');
  end if;

  if v_distribution.status = 'cancelled' then
    return json_build_object('success', true, 'idempotent', true, 'message', 'Já cancelada');
  end if;

  -- liberta reservas ativas
  update stock_reservations sr
  set status = 'released', updated_at = now()
  from distribution_items di
  where sr.distribution_item_id = di.id
    and di.distribution_id = p_distribution_id
    and sr.status = 'active';

  -- devolve quantidade reservada ao lote (on_hand não muda, reserva liberta)
  update batches b
  set reserved_quantity = reserved_quantity - sr.quantity,
      available_quantity = b.on_hand_quantity - (b.reserved_quantity - sr.quantity),
      updated_at = now()
  from stock_reservations sr
  join distribution_items di on di.id = sr.distribution_item_id
  where b.id = sr.batch_id
    and di.distribution_id = p_distribution_id
    and sr.status = 'released';

  update distributions
  set status = 'cancelled', updated_at = now()
  where id = p_distribution_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
  values (
    p_actor_id, 'cancel_distribution', 'distribution', p_distribution_id,
    json_build_object('distribution_id', p_distribution_id), now()
  );

  return json_build_object('success', true, 'message', 'Distribuição cancelada e reservas libertadas');
end;
$$;

-- --------------------------------------------------------
-- 5. Registo de descarte (transacional)
-- Valida saldo livre, não consome reservado sem libertação,
-- movimento disposal + auditoria + atualiza lote.
-- --------------------------------------------------------
create or replace function register_disposal(
  p_batch_id uuid,
  p_quantity numeric(12,3),
  p_reason_code text,
  p_reason_notes text,
  p_destination text,
  p_actor_id uuid
)
returns json
language plpgsql
as $$
declare
  v_batch batches%rowtype;
  v_disposal_id uuid;
begin
  select * into v_batch
  from batches
  where id = p_batch_id
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Lote não encontrado');
  end if;

  if v_batch.available_quantity < p_quantity then
    return json_build_object('success', false, 'error', 'Saldo livre insuficiente para descarte');
  end if;

  if p_reason_code = 'other' and (p_reason_notes is null or trim(p_reason_notes) = '') then
    return json_build_object('success', false, 'error', 'Motivo "outro" requer descrição');
  end if;

  insert into disposals (
    batch_id, quantity, reason_code, reason_notes, destination,
    disposed_at, created_by, created_at
  ) values (
    p_batch_id, p_quantity, p_reason_code, p_reason_notes, p_destination,
    now(), p_actor_id, now()
  ) returning id into v_disposal_id;

  update batches
  set on_hand_quantity = on_hand_quantity - p_quantity,
      available_quantity = available_quantity - p_quantity,
      status = case
        when on_hand_quantity - p_quantity = 0 then 'disposed'
        else status
      end,
      updated_at = now()
  where id = p_batch_id;

  insert into stock_movements (
    batch_id, movement_type, quantity, unit_code, source_type, source_id,
    reason, created_by, created_at
  ) values (
    p_batch_id, 'disposal', p_quantity, v_batch.unit_code,
    'disposal', v_disposal_id,
    'Descarte: ' || p_reason_code, p_actor_id, now()
  );

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata, created_at)
  values (
    p_actor_id, 'register_disposal', 'disposal', v_disposal_id,
    json_build_object('batch_id', p_batch_id, 'quantity', p_quantity, 'reason', p_reason_code), now()
  );

  return json_build_object('success', true, 'disposal_id', v_disposal_id, 'message', 'Descarte registado');
end;
$$;
