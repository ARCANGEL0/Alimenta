import { connection } from 'next/server';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import BotaoAcao from '@/components/form/BotaoAcao';
import { listarUsuarios } from '@/modules/usuarios/queries';
import {
  actionCriarUsuarioSimples,
  actionDesativarUsuario,
} from '@/modules/usuarios/actions';
import { formatDateTime } from '@/lib/formatting';

export const instant = false;


const FUNCOES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operator', label: 'Operador' },
  { value: 'social_worker', label: 'Assistente social' },
];

export default async function UsuariosPage() {
  await connection();
  const usuarios = await listarUsuarios();

  return (
    <div className="space-y-6">
      <PageHeader titulo="Utilizadores" descricao="Contas de acesso à plataforma." />
      <Tabela
        cabecalhos={['Nome', 'Email', 'Funções', 'Estado', 'Criado em', '']}
        vazio="Ainda não há utilizadores."
        linhas={usuarios.map((u) => [
          u.full_name ?? '—',
          u.email,
          u.roles.map((r) => FUNCOES.find((f) => f.value === r)?.label ?? r).join(', '),
          <Badge key={u.id} variant={u.is_active ? 'success' : 'secondary'}>
            {u.is_active ? 'ativo' : 'inativo'}
          </Badge>,
          formatDateTime(u.created_at),
          u.is_active ? (
            <BotaoAcao
              key={u.id}
              acao={actionDesativarUsuario.bind(null, u.id)}
              className="text-xs font-medium text-danger hover:underline"
            >
              desativar
            </BotaoAcao>
          ) : (
            '—'
          ),
        ])}
      />
      <Formulario
        titulo="Novo utilizador"
        acao={actionCriarUsuarioSimples}
        botao="Criar utilizador"
        campos={[
          { name: 'full_name', label: 'Nome completo', required: true },
          { name: 'email', label: 'Email', required: true, placeholder: 'nome@exemplo.pt' },
          { name: 'password', label: 'Palavra-passe', type: 'text', required: true, placeholder: 'mín. 8 caracteres' },
          { name: 'role', label: 'Função', type: 'select', required: true, options: FUNCOES },
        ]}
      />
    </div>
  );
}
