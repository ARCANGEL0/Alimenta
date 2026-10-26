-- Seed de demonstração do ALIMENTA (plain PostgreSQL)
-- TODOS os registros são sintéticos e fictícios, identificados com o prefixo DEPO-
-- para evitar qualquer confusão com dados reais.
-- Não há doações reais, beneficiários reais, utilizadores reais nem resultados
-- de impacto. Carregar apenas em ambiente de desenvolvimento/demo.

-- inserir funções
insert into roles (code, name) values
  ('admin', 'Administrador'),
  ('operator', 'Operador'),
  ('social_worker', 'Assistente social')
on conflict (code) do nothing;

-- perfis de demonstração (senhas: demo1234 / admin1234, alterar em produção)
insert into profiles (email, full_name, password_hash, is_active) values
  ('operador@alimenta.demo', 'Operador ALIMENTA', crypt('demo1234', gen_salt('bf', 10)), true),
  ('admin@alimenta.demo', 'Administrador ALIMENTA', crypt('admin1234', gen_salt('bf', 10)), true)
on conflict (email) do nothing;

insert into user_roles (user_id, role_id)
select p.id, r.id
from profiles p, roles r
where (p.email = 'operador@alimenta.demo' and r.code = 'operator')
   or (p.email = 'admin@alimenta.demo' and r.code = 'admin')
on conflict do nothing;

-- categorias
insert into categories (name, description) values
  ('DEPO-CAT-01', 'Cereais e derivados'),
  ('DEPO-CAT-02', 'Legumes e verduras'),
  ('DEPO-CAT-03', 'Laticínios'),
  ('DEPO-CAT-04', 'Enlatados'),
  ('DEPO-CAT-05', 'Higiene')
on conflict (name) do nothing;

-- produtos
insert into products (sku, name, category_id, default_unit, description) values
  ('DEPO-SKU-01', 'Arroz branco 1kg', (select id from categories where name = 'DEPO-CAT-01'), 'kg', 'Arroz branco embalado'),
  ('DEPO-SKU-02', 'Macarrão espaguete 500g', (select id from categories where name = 'DEPO-CAT-01'), 'unidade', 'Macarrão seco'),
  ('DEPO-SKU-03', 'Feijão carioca 1kg', (select id from categories where name = 'DEPO-CAT-01'), 'kg', 'Feijão seco'),
  ('DEPO-SKU-04', 'Óleo de soja 900ml', (select id from categories where name = 'DEPO-CAT-04'), 'unidade', 'Óleo vegetal'),
  ('DEPO-SKU-05', 'Leite UHT 1L', (select id from categories where name = 'DEPO-CAT-03'), 'unidade', 'Leite longa vida'),
  ('DEPO-SKU-06', 'Sabonete', (select id from categories where name = 'DEPO-CAT-05'), 'unidade', 'Sabonete de uso pessoal')
on conflict (sku) do nothing;

-- armazém e localizações
insert into warehouses (code, name, address) values
  ('DEPO-WH-01', 'Armazém Central Porto', 'Rua das Flores 123, Porto')
on conflict (code) do nothing;

insert into storage_locations (warehouse_id, code, description)
select id, 'DEPO-LOC-A1', 'Prateleira A - zona seca' from warehouses where code = 'DEPO-WH-01'
on conflict (warehouse_id, code) do nothing;

insert into storage_locations (warehouse_id, code, description)
select id, 'DEPO-LOC-B2', 'Câmara frigorífica B' from warehouses where code = 'DEPO-WH-01'
on conflict (warehouse_id, code) do nothing;

-- doadores fictícios
insert into donors (code, name, donor_type, email, phone, address) values
  ('DEPO-DON-01', 'Supermercado Modelo', 'Supermercado', 'contato@demomodelo.pt', '+351 22 000 0001', 'Av. da Boavista 500, Porto'),
  ('DEPO-DON-02', 'Padaria Central', 'Padaria', 'ola@demopadaria.pt', '+351 22 000 0002', 'Rua Santa Catarina 100, Porto'),
  ('DEPO-DON-03', 'Mercado Produtor Local', 'Mercado/produtor', 'geral@demomercado.pt', '+351 22 000 0003', 'Largo do Mercado 10, Porto')
on conflict (code) do nothing;

-- agregados familiares fictícios
insert into households (code, household_size, parish, status) values
  ('DEPO-HH-01', 3, 'Cedofeita', 'ativo'),
  ('DEPO-HH-02', 5, 'Bonfim', 'ativo'),
  ('DEPO-HH-03', 2, 'Paranhos', 'ativo')
on conflict (code) do nothing;

-- beneficiários fictícios
insert into beneficiaries (code, household_id, full_name, phone, email, is_primary_contact, status) values
  ('DEPO-BEN-01', (select id from households where code = 'DEPO-HH-01'), 'Ana Silva', '+351 91 000 0001', 'ana.silva@demo.pt', true, 'ativo'),
  ('DEPO-BEN-02', (select id from households where code = 'DEPO-HH-02'), 'João Santos', '+351 91 000 0002', 'joao.santos@demo.pt', true, 'ativo'),
  ('DEPO-BEN-03', (select id from households where code = 'DEPO-HH-03'), 'Maria Oliveira', '+351 91 000 0003', 'maria.oliveira@demo.pt', true, 'ativo')
on conflict (code) do nothing;

-- configurações iniciais (limiares de validade)
insert into settings (key, value, updated_at) values
  ('expiry_thresholds', jsonb_build_object(
    'expired_days', 0,
    'critical_days', 3,
    'attention_days', 7
  ), now()),
  ('alert_use_by_blocked', jsonb_build_object('enabled', true), now()),
  ('alert_best_before_review', jsonb_build_object('enabled', true), now())
on conflict (key) do update set value = excluded.value, updated_at = now();

-- nota: o perfil do operador tem senha 'demo1234' (hash gerado via bcrypt em produção).
-- Não usar esta senha em ambiente real.
