import { redirectDemoEstudianteOrLogin } from '@/app/demo/_shared/redirectDemoEstudianteOrLogin';

export default function LegacyDemoEstadisticasRedirect() {
  redirectDemoEstudianteOrLogin('estadisticas');
}
