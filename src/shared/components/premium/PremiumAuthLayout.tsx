'use client';

import type { ReactNode } from 'react';
import PremiumPanelShell from './PremiumPanelShell';

type PremiumAuthLayoutProps = {
  children: ReactNode;
  maxWidthClass?: string;
  className?: string;
};

/** Layout centrado dark-glass para login y acceso coordinador. */
export default function PremiumAuthLayout({
  children,
  maxWidthClass = 'max-w-2xl',
  className = '',
}: PremiumAuthLayoutProps) {
  return (
    <PremiumPanelShell centered className={className}>
      <div className={`mx-auto w-full ${maxWidthClass}`}>{children}</div>
    </PremiumPanelShell>
  );
}
