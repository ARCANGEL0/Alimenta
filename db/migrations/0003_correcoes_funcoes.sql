-- Migration 0003: correções às funções transacionais de stock

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
  v_warehouse_id uuid;
  v_location_id uuid;
begin
  select * into v_donation
  from donations
  where id = p_donation_id
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Doação não encontrada');
  end if;

  if v_donation.status in ('accepted', 'rejected', 'partially_accepted') then
    return json_build_object(
      'success', true,
      'idempotent', true,
      'status', v_donation.status,
      'message', 'Inspeção já fechada anteriormente'
    );
  end if;

  if not exists (select 1 from donation_items where donation_id = p_donation_id) then
    return json_build_object('success', false, 'error', 'A doação não tem itens');
  end if;

  if exists (
    select 1 from donation_items
    where donation_id = p_donation_id
      and quantity_accepted + quantity_rejected = 0
  ) then
    return json_build_object('success', false, 'error', 'Há itens por inspecionar');
  end if;

  select id into v_warehouse_id from warehouses where is_active order by created_at limit 1;
  select id into v_location_id from storage_locations
    where warehouse_id = v_warehouse_id order by code limit 1;

  if v_warehouse_id is null then
    return json_build_object('success', false, 'error', 'Não há nenhum armazém ativo');
  end if;

  for v_item in
    select id, product_id, quantity_accepted, unit_code,
           supplier_batch_code, expiry_date, expiry_type
    from donation_items
    where donation_id = p_donation_id
  loop
    if v_item.quantity_accepted > 0 then
      insert into batches (
        internal_code, product_id, donation_item_id, supplier_batch_code,
        warehouse_id, storage_location_id, received_at, expiry_date, expiry_type,
        initial_quantity, on_hand_quantity, reserved_quantity, available_quantity,
        unit_code, status
      ) values (
        'LOTE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
        v_item.product_id,
        v_item.id,
        v_item.supplier_batch_code,
        v_warehouse_id,
        v_location_id,
        v_donation.received_at,
        v_item.expiry_date,
        v_item.expiry_type,
        v_item.quantity_accepted,
        v_item.quantity_accepted,
        0,
        v_item.quantity_accepted,
        v_item.unit_code,
        'available'
      ) returning id into v_batch_id;

      insert into stock_movements (
        batch_id, movement_type, quantity, unit_code, source_type, source_id,
        reason, created_by
      ) values (
        v_batch_id, 'receipt', v_item.quantity_accepted, v_item.unit_code,
        'donation_item', v_item.id,
        'Entrada por aceitação de doação', p_actor_id
      );
    end if;
  end loop;

  update donations
  set status = case
    when not exists (
      select 1 from donation_items
      where donation_id = p_donation_id and quantity_accepted > 0
    ) then 'rejected'
    when exists (
      select 1 from donation_items
      where donation_id = p_donation_id and quantity_rejected > 0
    ) then 'partially_accepted'
    else 'accepted'
  end,
  updated_at = now()
  where id = p_donation_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    p_actor_id, 'close_donation_inspection', 'donation', p_donation_id,
    json_build_object('donation_id', p_donation_id)
  );

  return json_build_object(
    'success', true,
    'idempotent', false,
    'status', (select status from donations where id = p_donation_id),
    'message', 'Inspeção fechada, lotes criados'
  );
end;
$$;

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
begin
  select * into v_distribution
  from distributions
  where id = p_distribution_id
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Distribuição não encontrada');
  end if;

  if v_distribution.status <> 'reserved' then
    return json_build_object('success', false, 'error', 'Reserva stock para o cabaz antes de confirmar a entrega');
  end if;

  for v_reservation in
    select sr.id, sr.batch_id, sr.quantity, sr.distribution_item_id
    from stock_reservations sr
    join distribution_items di on di.id = sr.distribution_item_id
    where sr.status = 'active'
      and di.distribution_id = p_distribution_id
    for update of sr
  loop
    select * into v_batch from batches where id = v_reservation.batch_id for update;

    if v_batch.status <> 'available'
       or (v_batch.expiry_type = 'use_by' and v_batch.expiry_date is not null and v_batch.expiry_date < current_date)
       or v_batch.on_hand_quantity < v_reservation.quantity
       or v_batch.reserved_quantity < v_reservation.quantity then
      raise exception 'Lote % não disponível ou saldo insuficiente', v_batch.internal_code;
    end if;

    update batches
    set on_hand_quantity = on_hand_quantity - v_reservation.quantity,
        reserved_quantity = reserved_quantity - v_reservation.quantity,
        status = case
          when on_hand_quantity - v_reservation.quantity = 0 then 'depleted'
          else status
        end,
        updated_at = now()
    where id = v_reservation.batch_id;

    insert into stock_movements (
      batch_id, movement_type, quantity, unit_code, source_type, source_id,
      reason, created_by
    ) values (
      v_reservation.batch_id, 'distribution', v_reservation.quantity, v_batch.unit_code,
      'distribution_item', v_reservation.distribution_item_id,
      'Saída por entrega de distribuição', p_actor_id
    );

    update stock_reservations
    set status = 'consumed', updated_at = now()
    where id = v_reservation.id;
  end loop;

  update distributions
  set status = 'delivered', delivered_at = now(), delivered_by = p_actor_id, updated_at = now()
  where id = p_distribution_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    p_actor_id, 'confirm_distribution', 'distribution', p_distribution_id,
    json_build_object('distribution_id', p_distribution_id)
  );

  return json_build_object('success', true, 'message', 'Distribuição entregue');
exception
  when others then
    return json_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function cancel_distribution(
  p_distribution_id uuid,
  p_actor_id uuid
)
returns json
language plpgsql
as $$
declare
  v_distribution distributions%rowtype;
  v_lote record;
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

  for v_lote in
    select sr.batch_id, sum(sr.quantity) as total
    from stock_reservations sr
    join distribution_items di on di.id = sr.distribution_item_id
    where di.distribution_id = p_distribution_id and sr.status = 'active'
    group by sr.batch_id
  loop
    update batches
    set reserved_quantity = reserved_quantity - v_lote.total,
        available_quantity = available_quantity + v_lote.total,
        updated_at = now()
    where id = v_lote.batch_id;
  end loop;

  update stock_reservations sr
  set status = 'released', updated_at = now()
  from distribution_items di
  where sr.distribution_item_id = di.id
    and di.distribution_id = p_distribution_id
    and sr.status = 'active';

  update distribution_items set quantity_reserved = 0 where distribution_id = p_distribution_id;

  update distributions
  set status = 'cancelled', updated_at = now()
  where id = p_distribution_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    p_actor_id, 'cancel_distribution', 'distribution', p_distribution_id,
    json_build_object('distribution_id', p_distribution_id)
  );

  return json_build_object('success', true, 'message', 'Distribuição cancelada, reservas libertadas');
end;
$$;
