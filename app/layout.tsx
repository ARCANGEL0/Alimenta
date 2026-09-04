import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], axes: ['opsz'] });
const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Alimenta+ — Gestão e Distribuição Alimentar Comunitária',
  description: 'Sistema de gestão e distribuição alimentar comunitária',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className={`${fraunces.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
