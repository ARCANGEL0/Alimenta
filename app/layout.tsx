import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './src/app/globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ALIMENTA — Gestão e Distribuição Alimentar Comunitária',
  description: 'Sistema de gestão e distribuição alimentar comunitária',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
