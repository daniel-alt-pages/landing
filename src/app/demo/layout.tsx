import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/app/landing-profesional/landing-profesional.css';

export const metadata: Metadata = {
  title: 'Demo interactiva',
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return children;
}
