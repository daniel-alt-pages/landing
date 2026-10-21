import { redirect } from 'next/navigation';

/** Home cuando `NEXT_PUBLIC_PANELS_ONLY=true` — entra al demo (sin login). */
export default function HomePanelsOnly() {
  redirect('/demo/estudiante/dashboard');
}
