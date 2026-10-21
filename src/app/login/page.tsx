import { redirect } from 'next/navigation';

/**
 * Login desactivado de momento en el fork experimental local.
 * Entrada directa al demo estudiante con fixtures sintéticos.
 */
export default function LoginBypassPage() {
  redirect('/demo/estudiante/dashboard');
}
