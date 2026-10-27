-- Seed adicional para testes de desenvolvimento

insert into donors (code, name, donor_type, email) values ('EX-DON-001', 'Doador Exemplo', 'Outro', 'exemplo@teste.pt') on conflict (code) do nothing;
