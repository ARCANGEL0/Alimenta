import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

const sizes = {
  sm: { img: 28, text: 'text-lg' },
  md: { img: 36, text: 'text-xl' },
  lg: { img: 44, text: 'text-2xl' },
};

export default function Logo({ variant = 'dark', size = 'md', href = '/' }: LogoProps) {
  const s = sizes[size];

  const content = (
    <>
      <Image
        src="/assets/icon-food.png"
        alt="Alimenta+"
        width={s.img}
        height={s.img}
        className="shrink-0"
      />
      <span className={`${s.text} font-bold tracking-tight ${variant === 'light' ? 'text-white' : 'text-ink'}`}>
        Alimenta<span className="text-forest" style={variant === 'light' ? { color: '#4ADE80' } : {}}>+</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center gap-2">
        {content}
      </Link>
    );
  }
  return <div className="flex items-center gap-2">{content}</div>;
}
