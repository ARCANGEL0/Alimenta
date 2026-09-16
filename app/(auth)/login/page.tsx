'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { ArrowRight, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

function Ondas() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path className="fill-forest-dark" opacity="0.55" d="M0 0H1440V190C1250 255 1060 140 840 175C620 210 400 310 0 225Z" />
      <path className="fill-green" opacity="0.35" d="M0 540C230 480 440 600 700 565C960 530 1170 455 1440 505V900H0Z" />
      <path className="fill-forest-dark" opacity="0.75" d="M0 640C250 590 480 690 760 660C1040 630 1230 575 1440 610V900H0Z" />
      <path className="fill-forest-dark" d="M0 750C260 705 520 790 800 765C1080 740 1260 700 1440 725V900H0Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.erro || 'Email ou senha incorretos.');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Não foi possível ligar ao servidor. Tenta outra vez.');
      setLoading(false);
    }
  }

  return (
    <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-forest px-6 py-10">
      <Ondas />

      <div className="relative z-10 w-full max-w-[440px] animate-pop-in">
        <div className="rounded-3xl bg-surface p-10 shadow-2xl shadow-black/30">
          <div className="flex justify-center">
            <Logo size="lg" href="/" />
          </div>

          <h1 className="font-display mt-6 text-center text-3xl font-semibold tracking-tight text-ink">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Entra para continuares a gerir o teu banco alimentar.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="label-field">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="o-teu-email@exemplo.pt"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="password" className="label-field">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted transition-colors hover:bg-black/5 hover:text-ink"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-4 text-base disabled:opacity-70">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  A entrar…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="font-medium text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline">
            ← Voltar à página inicial
          </Link>
        </p>
      </div>
    </div>
  );
}
