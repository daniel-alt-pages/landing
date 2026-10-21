import type { ReactNode } from 'react';

type ButtonProps = {
  href?: string;
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  onDark?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

export function Button({
  href,
  children,
  variant = 'primary',
  onDark = false,
  type = 'button',
  disabled,
  onClick,
  ariaLabel,
}: ButtonProps) {
  const className = `${variant === 'primary' ? 'ag-btn' : 'ag-btn-ghost'}${onDark && variant === 'ghost' ? ' ag-on-dark' : ''}`;
  if (href) {
    const external = href.startsWith('http');
    return (
      <a className={className} href={href} aria-label={ariaLabel} onClick={onClick} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
        {children}
      </a>
    );
  }
  return (
    <button className={className} type={type} disabled={disabled} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
