'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/postgres/client';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const postgres = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await postgres.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Email ou senha incorretos. Tente novamente.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text">ALIMENTA</h1>
          <p className="text-muted text-sm">Sistema de Gestão e Distribuição Alimentar Comunitária</p>
        </div>

        <div className="bg-surface border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-6">Iniciar sessão</h2>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-forest text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
