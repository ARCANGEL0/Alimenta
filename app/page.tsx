'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';
import Reveal from '@/components/Reveal';
import {
  Truck, ShieldCheck, BarChart3, Clock, Users, ArrowRight, Wheat,
  Boxes, HandHeart, ClipboardCheck,
} from 'lucide-react';

const features = [
  { icon: Boxes, title: 'Stock', desc: 'Sabes exatamente o que tens, onde está e quando vence. Sem surpresas.' },
  { icon: Clock, title: 'Validades', desc: 'O que vence primeiro sai primeiro. Avisos antes de qualquer problema.' },
  { icon: Truck, title: 'Entregas', desc: 'Montas o cabaz, o sistema reserva o stock certo e confirma tudo de uma vez.' },
  { icon: ShieldCheck, title: 'Segurança', desc: 'Vencidos e estragados ficam bloqueados. Nunca chegam a ninguém.' },
  { icon: Users, title: 'Famílias', desc: 'Cada agregado registado, cada entrega ligada a quem a recebeu.' },
  { icon: BarChart3, title: 'Relatórios', desc: 'Entradas, saídas e stock atual em tempo real. Sem esperar por ninguém.' },
];

const steps = [
  { icon: HandHeart, title: 'Chega uma doação', desc: 'Registas quem deu e o quê. Podes aceitar tudo ou só parte.' },
  { icon: Boxes, title: 'Nasce um lote', desc: 'Cada quantidade aceite fica com código próprio, validade e sítio no armazém.' },
  { icon: ClipboardCheck, title: 'Preparas a entrega', desc: 'Escolhes a família, montas o cabaz e o stock fica reservado na hora.' },
  { icon: Truck, title: 'Entregas e pronto', desc: 'Confirmas a entrega e o stock baixa automaticamente. Fica tudo registado.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setScrollY(window.scrollY);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-canvas">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? 'border-b border-line/70 bg-canvas/85 shadow-sm backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="container-x flex h-[72px] items-center justify-between">
          <Logo size="md" />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#o-que-faz" className="nav-link nav-link-underline">O que faz</a>
            <a href="#como-funciona" className="nav-link nav-link-underline">Como funciona</a>
            <a href="#seguranca" className="nav-link nav-link-underline">Segurança</a>
          </nav>
          <Link href="/login" className="btn-primary !px-5 !py-2.5 transition-transform hover:scale-105 active:scale-95">
            Entrar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="bg-hero-pattern relative overflow-hidden pt-[72px]">
        <div className="container-x grid items-center gap-12 py-24 lg:grid-cols-2 lg:py-32">
          <Reveal>
            <p className="eyebrow mb-4 flex items-center gap-2">
              <Wheat className="h-4 w-4" /> Para quem gere bancos alimentares
            </p>
            <h1 className="font-display text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-ink lg:text-6xl">
              Sabe sempre onde está cada quilo de comida.
            </h1>
            <Reveal delay={120}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                O Alimenta+ põe doações, lotes, validades, entregas e famílias num só sítio.
                Tudo registado, tudo simples, nada perdido.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/login" className="btn-primary group">
                  Entrar na plataforma
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <a href="#o-que-faz" className="btn-outline">
                  Ver como funciona
                </a>
              </div>
            </Reveal>
          </Reveal>

          <Reveal delay={200} y={40}>
            <div
              className="relative transition-transform duration-100 ease-out will-change-transform"
              style={{ transform: `translateY(${scrollY * -0.06}px)` }}
            >
              <div className="card overflow-hidden shadow-2xl shadow-forest/10">
                <Image
                  src="/assets/hero-food-basket.png"
                  alt="Cesta com alimentos frescos"
                  width={800}
                  height={600}
                  priority
                  className="h-auto w-full"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="o-que-faz" className="container-x scroll-mt-24 py-24">
        <Reveal>
          <p className="eyebrow mb-4">O que faz</p>
          <h2 className="font-display max-w-2xl text-4xl font-semibold tracking-tight text-ink">
            O dia a dia de quem gere doações, simplificado.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="card group h-full p-6 hover:shadow-xl hover:shadow-forest/10">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest/10 text-forest transition-all duration-300 group-hover:scale-110 group-hover:bg-forest group-hover:text-white">
                  <f.icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-24 border-y border-line bg-surface py-24">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow mb-4">Como funciona</p>
            <h2 className="font-display max-w-2xl text-4xl font-semibold tracking-tight text-ink">
              Uma doação entra, uma entrega sai. Em quatro passos.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 110}>
                <div className="group relative h-full rounded-2xl border border-line bg-canvas p-6 transition-all duration-300 hover:-translate-y-2 hover:border-forest/30 hover:shadow-lg hover:shadow-forest/5">
                  <span className="absolute right-5 top-5 font-display text-4xl font-semibold text-forest/10 transition-colors group-hover:text-forest/25">
                    {i + 1}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-white">
                    <s.icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="seguranca" className="container-x scroll-mt-24 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="card relative overflow-hidden bg-forest p-10 text-white">
              <ShieldCheck className="h-10 w-10 text-leaf" />
              <h2 className="font-display mt-6 text-3xl font-semibold tracking-tight">Os dados são teus.</h2>
              <ul className="mt-6 space-y-3 text-white/85">
                {['Quem vê o quê é definido por ti', 'Cada ação fica registada', 'Stock nunca fica negativo', 'Nada partilhado sem permissão'].map((t) => (
                  <Reveal key={t} delay={100}>
                    <li className="flex gap-2"><span className="text-leaf">✓</span> {t}</li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <p className="eyebrow mb-4">Segurança</p>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-ink">
              Três perfis, cada um vê só o que precisa.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Quem gere vê tudo. Quem trata do stock e das entregas vê só isso. Quem trabalha
              com as famílias vê só as famílias. Simples assim.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-forest py-24">
        <div className="absolute inset-0 bg-hero-pattern opacity-40" />
        <Reveal className="container-x relative flex flex-col items-center text-center">
          <h2 className="font-display max-w-2xl text-balance text-4xl font-semibold tracking-tight text-white lg:text-5xl">
            Começa hoje.
          </h2>
          <p className="mt-4 max-w-xl text-white/70">
            Entra com a tua conta e começa a gerir doações, stock e entregas.
          </p>
          <Link
            href="/login"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-forest shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
          >
            Entrar
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </Reveal>
      </section>

      <footer className="border-t border-line bg-surface py-10">
        <div className="container-x flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size="sm" />
          <p className="text-sm text-muted">Alimenta+ — gestão simples para quem faz chegar comida a quem precisa</p>
        </div>
      </footer>
    </div>
  );
}

function ArrowDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
