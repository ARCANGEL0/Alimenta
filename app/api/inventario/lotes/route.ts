import { query } from '@/lib/db/pool';
import { verificarSessao } from '@/lib/auth/middleware-servidor';
import type { Role } from '@/lib/auth/roles';
import { NextResponse } from 'next/server';

const ROLE_ADMIN: Role = 'admin';
const ROLE_OPERADOR: Role = 'operator';

export async function POST(request: Request) {
  try {
    await verificarSessao([ROLE_ADMIN, ROLE_OPERADOR]);

    const {
      internal_code,
      product_id,
      warehouse_id,
      storage_location_id,
      received_at,
      expiry_date,
      expiry_type,
      initial_quantity,
      unit_code,
    } = await request.json();

    const result = await query(
      `insert into batches (
        internal_code, product_id, warehouse_id, storage_location_id,
        received_at, expiry_date, expiry_type, initial_quantity,
        on_hand_quantity, reserved_quantity, available_quantity, unit_code, status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $9, $10, 'available')
      returning *`,
      [
        internal_code,
        product_id,
        warehouse_id,
        storage_location_id ?? null,
        received_at,
        expiry_date ?? null,
        expiry_type ?? null,
        initial_quantity,
        initial_quantity,
        unit_code,
      ],
    );

    return NextResponse.json(result.rows[0]);
  } catch (erro) {
    return NextResponse.json(
      { erro: 'Não foi possível criar o lote.' },
      { status: 500 },
    );
  }
}
