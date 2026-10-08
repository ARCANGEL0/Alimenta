import { connection } from 'next/server';
import PageHeader from '@/components/layout/PageHeader';
import Tabela from '@/components/ui/tabela';
import { Badge } from '@/components/ui/badge';
import Formulario from '@/components/form/Formulario';
import BotaoAcao from '@/components/form/BotaoAcao';
import { listarCategorias } from '@/modules/catalogo/queries';
import {
  actionCriarCategoria,
  actionDesativarCategoria,
} from '@/modules/catalogo/actions';
import { formatDateTime } from '@/lib/formatting';

export const instant = false;


export default async function CategoriasPage() {
  await connection();
  const categorias = await listarCategorias();

  return (
    <div className="space-y-6">
      <PageHeader titulo="Categorias" descricao="Categorias dos produtos do armazém." />
      <Tabela
        cabecalhos={['Nome', 'Descrição', 'Estado', 'Criada em', '']}
        vazio="Ainda não há categorias. Cria a primeira em baixo."
        linhas={categorias.map((c) => [
          c.name,
          c.description ?? '—',
          <Badge key={c.id} variant={c.is_active ? 'success' : 'secondary'}>
            {c.is_active ? 'ativa' : 'inativa'}
          </Badge>,
          formatDateTime(c.created_at),
          c.is_active ? (
            <BotaoAcao
              key={c.id}
              acao={actionDesativarCategoria.bind(null, c.id)}
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
        titulo="Nova categoria"
        acao={actionCriarCategoria}
        botao="Criar categoria"
        campos={[
          { name: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Mercearia' },
          { name: 'description', label: 'Descrição', placeholder: 'opcional' },
        ]}
      />
    </div>
  );
}
