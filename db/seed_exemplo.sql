-- Seed de exemplo para ambiente de desenvolvimento
-- Dados sinteticos, apenas para teste local

insert into categories (name, description) values ('Exemplo', 'Categoria de exemplo') on conflict (name) do nothing;
