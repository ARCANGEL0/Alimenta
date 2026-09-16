import { NextResponse } from 'next/server';
import { query } from '@/lib/db/pool';
import { comparePassword } from '@/lib/auth/hash';
import { gerarTokenSessao, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ erro: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    const result = await query(
      'SELECT id, email, full_name, password_hash, is_active FROM profiles WHERE email = $1',
      [email],
    );

    const perfil = result.rows[0];
    if (!perfil || !perfil.is_active) {
      return NextResponse.json({ erro: 'Email ou senha incorretos.' }, { status: 401 });
    }

    const senhaValida = await comparePassword(password, perfil.password_hash);
    if (!senhaValida) {
      return NextResponse.json({ erro: 'Email ou senha incorretos.' }, { status: 401 });
    }

    // Busca as roles do utilizador
    const rolesResult = await query(
      `SELECT r.code FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [perfil.id],
    );

    const roles = rolesResult.rows.map((r) => r.code);

    const sessionPayload = {
      userId: perfil.id,
      email: perfil.email,
      fullName: perfil.full_name,
      roles,
    };

    await setSessionCookie(gerarTokenSessao(sessionPayload));

    return NextResponse.json({ sucesso: true });
  } catch (erro) {
    console.error('Erro no login:', erro);
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 });
  }
}
