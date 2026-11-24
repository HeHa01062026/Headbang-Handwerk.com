import { cn } from '@/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  href,
  target,
  rel,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'border border-[color:var(--color-accent)] bg-[linear-gradient(180deg,rgba(31,20,14,0.92)_0%,rgba(16,10,7,0.84)_100%)] text-[color:var(--text-link)] shadow-[0_8px_20px_color-mix(in_srgb,var(--color-accent)_28%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-accent-soft)_20%,transparent)] hover:-translate-y-0.5 hover:border-[color:var(--color-accent-soft)]',
    secondary:
      'border border-[color:var(--color-border)] text-[color:var(--text-link)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-2)] hover:border-[color:var(--color-accent)]',
    ghost: 'text-[color:var(--text-link)] hover:bg-white/10',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
  };

  // Masse nach Material Design 3, Abschnitt "Measurements"
  // (Hoehe / Innenabstand seitlich / Icon / Abstand Icon zu Label):
  //   sm = MD3 Extra small   32dp / 12dp / 20dp / 4dp
  //   md = MD3 Small         40dp / 16dp / 20dp / 8dp
  //   lg = MD3 Medium        56dp / 24dp / 24dp / 8dp
  //
  // MD3 bestimmt die Buttongroesse ueber eine feste Containerhoehe mit mittig
  // sitzendem Label, nicht ueber vertikales Padding. Deshalb min-h statt py als
  // Massgeber. min-h und nicht h, damit ein langes Label aus dem CMS umbrechen
  // kann, ohne aus dem Button zu laufen; das py greift nur in diesem Fall.
  //
  // Eckenradius nach der MD3-Konfiguration "Square" (12dp / 12dp / 16dp). Die
  // MD3-Vorgabe waere voll rund; Square passt zur kantigen Marke und ist in
  // M3 Expressive ausdruecklich vorgesehen.
  const sizes = {
    sm: 'min-h-8 gap-1 rounded-xl px-3 py-1 text-sm [&_svg]:size-5',
    md: 'min-h-10 gap-2 rounded-xl px-4 py-1.5 text-sm [&_svg]:size-5',
    lg: 'min-h-14 gap-2 rounded-2xl px-6 py-2 text-base [&_svg]:size-6',
  };

  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <a href={href} className={classes} target={target} rel={rel}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
