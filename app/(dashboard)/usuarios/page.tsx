import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type Usuario = {
  id: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[];
};

async function listarUsuarios(): Promise<Usuario[]> {
  const postgres = createServerClient();

  const { data: perfis, error } = await postgres
    .from('profiles')
    .select(`
      *,
      user_roles (
        roles (code)
      )
    `)
    .order('full_name', { ascending: true });

  if (error) {
    return [];
  }

  return (
    perfis?.map((perfil) => ({
      id: perfil.id,
      full_name: perfil.full_name,
      is_active: perfil.is_active,
      roles: (perfil.user_roles ?? []).map((ur) => ur.roles?.code).filter(Boolean),
    })) ?? []
  ) as Usuario[];
}

async function desativarUsuario(formData: FormData) {
  'use server';

  const id = formData.get('id') as string;

  const postgres = createServerClient();
  const { error } = await postgres
    .from('profiles')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return { erro: 'Não foi possível desativar o utilizador.' };
  }

  return { sucesso: true };
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roles, setRoles] = useState<string[]>([]);

  async function carregar() {
    const lista = await listarUsuarios();
    setUsuarios(lista);
    setCarregando(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizadores"
        description="Gestão de contas e funções."
      />

      <div className="flex items-center justify-between">
        <Button onClick={() => setAbrirDialog(true)}>Novo utilizador</Button>
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialog ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Novo utilizador</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                E-mail
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="utilizador@exemplo.pt"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Palavra-passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Nome completo
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome do utilizador"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Funções
              </label>
              <div className="flex gap-2">
                {['admin', 'operator', 'social_worker'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      if (roles.includes(role)) {
                        setRoles(roles.filter((r) => r !== role));
                      } else {
                        setRoles([...roles, role]);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border ${
                      roles.includes(role)
                        ? 'bg-forest text-white border-forest'
                        : 'bg-surface text-text border-gray-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted mt-1">
                Selecione pelo menos uma função.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialog(false);
                  setEmail('');
                  setPassword('');
                  setFullName('');
                  setRoles([]);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar utilizador</Button>
            </div>
          </form>
        </div>
      </div>

      {carregando ? (
        <div className="p-4 text-center text-muted">A carregar utilizadores…</div>
      ) : (
        <Card>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Funções
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{usuario.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {usuario.roles.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                      {usuario.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted">
                    Nenhum utilizador registado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
