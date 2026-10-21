import { redirect } from 'next/navigation';

/** La web pública es la landing. Los paneles del fork siguen en sus rutas. */
export default function Home() {
  redirect('/landing');
}
