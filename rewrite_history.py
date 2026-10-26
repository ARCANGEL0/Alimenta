#!/usr/bin/env python3
import subprocess, os

os.chdir('/home/arcxlo/projects/FACULDADE')

GIT_USER = 'arcxlo'
GIT_EMAIL = 'henry@arcangelo.net'

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr

def commit(files, msg):
    for f in files:
        rc, out, err = run(f'git add "{f}"')
        if rc != 0:
            print(f'ERRO add {f}: {err}')
    rc, out, err = run(f'git -c user.name="{GIT_USER}" -c user.email="{GIT_EMAIL}" commit -q -m "{msg}"')
    if rc != 0:
        print(f'ERRO commit "{msg}": {err}')
    else:
        print(f'OK: {msg}')

commits = [
    (['package.json'], 'package'),
    (['package-lock.json'], 'lock'),
    (['tsconfig.json'], 'tsconfig'),
    (['next.config.ts'], 'next config'),
    (['eslint.config.mjs'], 'eslint'),
    (['vitest.config.ts'], 'vitest'),
    (['.gitignore'], 'gitignore'),
    (['public/file.svg', 'public/globe.svg', 'public/next.svg', 'public/vercel.svg', 'public/window.svg'], 'public assets'),
    (['app/layout.tsx'], 'app layout'),
    (['app/globals.css'], 'globals css'),
    (['middleware.ts'], 'middleware'),
    (['app/auth/callback/route.ts'], 'auth callback'),
    (['src/components/ui/badge.tsx'], 'badge'),
    (['src/components/ui/button.tsx'], 'button'),
    (['src/components/ui/card.tsx'], 'card'),
    (['src/components/ui/input.tsx'], 'input'),
    (['src/components/layout/AppSidebar.tsx'], 'sidebar'),
    (['src/components/layout/AppTopbar.tsx'], 'topbar'),
    (['src/components/layout/Breadcrumbs.tsx'], 'breadcrumbs'),
    (['src/components/layout/PageHeader.tsx'], 'page header'),
    (['src/lib/constants.ts'], 'constants'),
    (['src/lib/formatting.ts'], 'formatting'),
    (['src/lib/utils.ts'], 'utils'),
    (['src/lib/permissions.ts'], 'permissions'),
    (['src/lib/auth/hash.ts'], 'auth hash'),
    (['src/lib/auth/middleware.ts'], 'auth middleware'),
    (['src/lib/auth/roles.ts'], 'auth roles'),
    (['src/lib/auth/session.ts'], 'auth session'),
    (['app/(auth)/login/layout.tsx'], 'login layout'),
    (['app/(auth)/login/page.tsx'], 'login page'),
    (['app/api/auth/login/route.ts'], 'login api'),
    (['app/api/auth/logout/route.ts'], 'logout api'),
    (['src/modules/catalogo/actions.ts'], 'catalogo actions'),
    (['src/modules/catalogo/queries.ts'], 'catalogo queries'),
    (['src/modules/catalogo/schemas.ts'], 'catalogo schemas'),
    (['src/modules/catalogo/types.ts'], 'catalogo types'),
    (['src/modules/doacoes/actions.ts'], 'doacoes actions'),
    (['src/modules/doacoes/queries.ts'], 'doacoes queries'),
    (['src/modules/doacoes/schemas.ts'], 'doacoes schemas'),
    (['src/modules/doacoes/types.ts'], 'doacoes types'),
    (['src/modules/inventario/actions.ts'], 'inventario actions'),
    (['src/modules/inventario/queries.ts'], 'inventario queries'),
    (['src/modules/inventario/schemas.ts'], 'inventario schemas'),
    (['src/modules/inventario/types.ts'], 'inventario types'),
    (['src/modules/validade/actions.ts'], 'validade actions'),
    (['src/modules/validade/queries.ts'], 'validade queries'),
    (['src/modules/validade/schemas.ts'], 'validade schemas'),
    (['src/modules/validade/types.ts'], 'validade types'),
    (['src/modules/distribuicoes/actions.ts'], 'distribuicoes actions'),
    (['src/modules/distribuicoes/queries.ts'], 'distribuicoes queries'),
    (['src/modules/distribuicoes/schemas.ts'], 'distribuicoes schemas'),
    (['src/modules/distribuicoes/types.ts'], 'distribuicoes types'),
    (['src/modules/desperdicio/actions.ts'], 'desperdicio actions'),
    (['src/modules/desperdicio/queries.ts'], 'desperdicio queries'),
    (['src/modules/desperdicio/schemas.ts'], 'desperdicio schemas'),
    (['src/modules/desperdicio/types.ts'], 'desperdicio types'),
    (['src/modules/beneficiarios/actions.ts'], 'beneficiarios actions'),
    (['src/modules/beneficiarios/queries.ts'], 'beneficiarios queries'),
    (['src/modules/beneficiarios/schemas.ts'], 'beneficiarios schemas'),
    (['src/modules/beneficiarios/types.ts'], 'beneficiarios types'),
    (['src/modules/usuarios/actions.ts'], 'usuarios actions'),
    (['src/modules/usuarios/queries.ts'], 'usuarios queries'),
    (['src/modules/usuarios/schemas.ts'], 'usuarios schemas'),
    (['src/modules/usuarios/types.ts'], 'usuarios types'),
    (['src/modules/dashboard/actions.ts'], 'dashboard actions'),
    (['src/modules/dashboard/queries.ts'], 'dashboard queries'),
    (['src/modules/dashboard/types.ts'], 'dashboard types'),
    (['app/(dashboard)/dashboard/page.tsx'], 'dashboard page'),
    (['app/(dashboard)/categorias/page.tsx'], 'categorias page'),
    (['app/(dashboard)/produtos/page.tsx'], 'produtos page'),
    (['app/(dashboard)/doadores/page.tsx'], 'doadores page'),
    (['app/(dashboard)/doacoes/page.tsx'], 'doacoes page'),
    (['app/(dashboard)/doacoes/[id]/page.tsx'], 'doacoes detail'),
    (['app/(dashboard)/inventario/page.tsx'], 'inventario page'),
    (['app/(dashboard)/inventario/[id]/page.tsx'], 'inventario detail'),
    (['app/(dashboard)/expirations/page.tsx'], 'expirations page'),
    (['app/(dashboard)/beneficiarios/page.tsx'], 'beneficiarios page'),
    (['app/(dashboard)/distribuicoes/page.tsx'], 'distribuicoes page'),
    (['app/(dashboard)/distribuicoes/[id]/page.tsx'], 'distribuicoes detail'),
    (['app/(dashboard)/descartes/page.tsx'], 'descartes page'),
    (['app/(dashboard)/usuarios/page.tsx'], 'usuarios page'),
    (['app/(auth)/dashboard/layout.tsx'], 'auth dashboard layout'),
    (['app/(dashboard)/api/validade/avaliar/route.ts'], 'avaliar route'),
    (['app/(dashboard)/api/validade/bloquear/route.ts'], 'bloquear route'),
    (['app/auth/callback/route.ts'], 'callback route'),
    (['src/app/globals.css'], 'src globals css'),
    (['src/lib/permissions.ts'], 'lib permissions'),
    (['db/migrations/0005_notificacoes.sql'], 'notifications migration'),
    (['db/seed_real_bacf.sql'], 'seed bacf'),
    (['src/components/notificacoes/SinoNotificacoes.tsx'], 'notification bell'),
    (['src/lib/rotulos.ts'], 'labels'),
    (['src/modules/notificacoes/actions.ts'], 'notifications actions'),
    (['src/modules/notificacoes/queries.ts'], 'notifications queries'),
    (['app/api/notificacoes/contagem/route.ts'], 'notification count route'),
    (['app/api/notificacoes/todas-lidas/route.ts'], 'mark all read route'),
    (['app/api/notificacoes/gerar/route.ts'], 'generate notifications route'),
    (['tests/disposal.test.ts'], 'disposal test'),
    (['tests/distribuicao.concorrencia.test.ts'], 'distribution concurrency test'),
    (['tests/distribution.test.ts'], 'distribution test'),
    (['tests/donation.test.ts'], 'donation test'),
    (['tests/fefo.test.ts'], 'fefo test'),
    (['tests/permissions.test.ts'], 'permissions test'),
]

print(f'Total de commits: {len(commits)}')
for files, msg in commits:
    commit(files, msg)

run('git log --format="%h %s" | wc -l')
