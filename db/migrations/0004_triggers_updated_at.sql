-- Migration 0004: remove triggers de updated_at em tabelas que não têm essa coluna

do $$
declare tbl text;
begin
  for tbl in
    select t.tgrelid::regclass::text
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where p.proname = 'set_updated_at'
      and not t.tgisinternal
      and not exists (
        select 1 from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = t.tgrelid::regclass::text
          and c.column_name = 'updated_at'
      )
  loop
    execute format('drop trigger if exists trg_%s_updated_at on %I', tbl, tbl);
  end loop;
end $$;
