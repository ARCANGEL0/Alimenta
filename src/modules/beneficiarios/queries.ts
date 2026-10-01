import { query } from '@/lib/db/pool';
import type {
  Agregado,
  AgregadoParaCriar,
  Beneficiario,
  BeneficiarioParaCriar,
  Necessidade,
  NecessidadeParaCriar,
} from './types';

export async function listarAgregados(): Promise<Agregado[]> {
  const result = await query(
    'select * from households order by code asc',
  );
  return result.rows as Agregado[];
}

export async function listarBeneficiarios(): Promise<Beneficiario[]> {
  const result = await query(
    `select b.*, h.code as household_code
     from beneficiaries b
     left join households h on h.id = b.household_id
     order by b.code asc`,
  );
  return result.rows as Beneficiario[];
}

export async function listarNecessidades(
  beneficiaryId: string,
): Promise<Necessidade[]> {
  const result = await query(
    `select * from beneficiary_needs
     where beneficiary_id = $1
     order by created_at desc`,
    [beneficiaryId],
  );
  return result.rows as Necessidade[];
}

export async function criarAgregado(
  payload: AgregadoParaCriar,
): Promise<Agregado> {
  const result = await query(
    `insert into households (code, household_size, parish, status)
     values ($1, $2, $3, $4)
     returning *`,
    [payload.code, payload.household_size ?? null, payload.parish ?? null, payload.status ?? null],
  );
  return result.rows[0] as Agregado;
}

export async function criarBeneficiario(
  payload: BeneficiarioParaCriar,
): Promise<Beneficiario> {
  const result = await query(
    `insert into beneficiaries (code, household_id, full_name, phone, email, is_primary_contact, status)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      payload.code,
      payload.household_id,
      payload.full_name ?? null,
      payload.phone ?? null,
      payload.email ?? null,
      payload.is_primary_contact ?? null,
      payload.status ?? null,
    ],
  );
  return result.rows[0] as Beneficiario;
}

export async function criarNecessidade(
  payload: NecessidadeParaCriar,
): Promise<Necessidade> {
  const result = await query(
    `insert into beneficiary_needs (beneficiary_id, need_type, value, notes)
     values ($1, $2, $3, $4)
     returning *`,
    [payload.beneficiary_id, payload.need_type, payload.value, payload.notes ?? null],
  );
  return result.rows[0] as Necessidade;
}


export async function listarBeneficiariosPorAgregado(householdId: string): Promise<Beneficiario[]> {
  const result = await query(`select b.*, h.code as household_code from beneficiaries b left join households h on h.id = b.household_id where b.household_id = $1 order by b.code asc`, [householdId]);
  return result.rows as Beneficiario[];
}
