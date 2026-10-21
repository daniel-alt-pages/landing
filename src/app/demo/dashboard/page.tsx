import { redirectDemoEstudianteOrLogin } from '@/app/demo/_shared/redirectDemoEstudianteOrLogin';

/** Legacy `/demo/dashboard` → demo estudiante interactiva. */
export default function LegacyDemoDashboardRedirect() {
  redirectDemoEstudianteOrLogin();
}
