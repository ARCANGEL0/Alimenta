import AppSidebar from '@/components/layout/AppSidebar';
import AppTopbar from '@/components/layout/AppTopbar';
import { verificarSessao, type Sessao } from '@/lib/auth/middleware-servidor';
import { ROLE_LABELS } from '@/lib/auth/roles';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  let sessao: Sessao;
  try {
    sessao = await verificarSessao();
  } catch {
    redirect('/login');
  }

  const nome = sessao.fullName ?? sessao.email;
  const funcao = sessao.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ');
  const iniciais = nome
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar nome={nome} email={sessao.email} iniciais={iniciais} />
      <div className="ml-[248px] flex min-h-screen flex-1 flex-col">
        <AppTopbar nome={nome} funcao={funcao} iniciais={iniciais} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
