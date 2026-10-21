import { redirect } from 'next/navigation';

/** La landing de cotización ya no se publica. La web es la alianza. */
export default function CotizacionSimulacroPage() {
  redirect('/landing');
}
