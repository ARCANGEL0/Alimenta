-- Migration 0005: Tabela de notificações do sistema
-- Notificações geradas automaticamente (ex: lotes prestes a vencer)
-- e manuais (ex: avisos ao utilizador)

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null check (type in ('info', 'warning', 'danger', 'success')),
  related_entity_type text, -- 'batch', 'distribution', 'donation', 'disposal', 'system'
  related_entity_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_read on notifications(read);
create index if not exists idx_notifications_created_at on notifications(created_at desc);

-- Função para gerar notificações de validade com base nos limiares configurados
create or replace function gerar_notificacoes_validade() returns void language plpgsql as $$
declare
  v_limiares jsonb;
  v_expired_days int;
  v_critical_days int;
  v_attention_days int;
  v_hoje date;
begin
  select value into v_limiares from settings where key = 'expiry_thresholds';
  v_expired_days := coalesce((v_limiares->>'expired_days')::int, 0);
  v_critical_days := coalesce((v_limiares->>'critical_days')::int, 3);
  v_attention_days := coalesce((v_limiares->>'attention_days')::int, 7);
  v_hoje := current_date;

  -- Notificar lotes vencidos (estado 'vencido')
  insert into notifications (title, message, type, related_entity_type, related_entity_id)
  select
    'Lote vencido: ' || b.internal_code,
    'O lote ' || b.internal_code || ' do produto ' || coalesce(p.name, '—') || ' expirou em ' || to_char(b.expiry_date, 'DD/MM/YYYY') || '.',
    'danger',
    'batch',
    b.id
  from batches b
  left join products p on p.id = b.product_id
  where b.expiry_date is not null
    and b.expiry_date < v_hoje - v_expired_days
    and b.status not in ('depleted', 'disposed', 'blocked')
    and not exists (
      select 1 from notifications n
      where n.related_entity_type = 'batch'
        and n.related_entity_id = b.id
        and n.title like 'Lote vencido: ' || b.internal_code || '%'
    );

  -- Notificar lotes críticos (próximos a vencer)
  insert into notifications (title, message, type, related_entity_type, related_entity_id)
  select
    'Lote a expirar: ' || b.internal_code,
    'O lote ' || b.internal_code || ' do produto ' || coalesce(p.name, '—') || ' vence em ' || to_char(b.expiry_date, 'DD/MM/YYYY') || '.',
    'warning',
    'batch',
    b.id
  from batches b
  left join products p on p.id = b.product_id
  where b.expiry_date is not null
    and b.expiry_date >= v_hoje - v_expired_days
    and b.expiry_date <= v_hoje + v_critical_days
    and b.status not in ('depleted', 'disposed', 'blocked')
    and not exists (
      select 1 from notifications n
      where n.related_entity_type = 'batch'
        and n.related_entity_id = b.id
        and n.title like 'Lote a expirar: ' || b.internal_code || '%'
    );

  -- Notificar lotes em atenção
  insert into notifications (title, message, type, related_entity_type, related_entity_id)
  select
    'Lote em atenção: ' || b.internal_code,
    'O lote ' || b.internal_code || ' do produto ' || coalesce(p.name, '—') || ' vence em ' || to_char(b.expiry_date, 'DD/MM/YYYY') || '.',
    'info',
    'batch',
    b.id
  from batches b
  left join products p on p.id = b.product_id
  where b.expiry_date is not null
    and b.expiry_date > v_hoje + v_critical_days
    and b.expiry_date <= v_hoje + v_attention_days
    and b.status not in ('depleted', 'disposed', 'blocked')
    and not exists (
      select 1 from notifications n
      where n.related_entity_type = 'batch'
        and n.related_entity_id = b.id
        and n.title like 'Lote em atenção: ' || b.internal_code || '%'
    );
end;
$$;
