export const metadata = {
  title: 'Iniciar sessão — ALIMENTA',
  description: 'Página de login do sistema ALIMENTA',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col items-center justify-center bg-canvas">{children}</div>;
}
