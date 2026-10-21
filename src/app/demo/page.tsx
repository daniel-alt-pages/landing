import { redirectDemoEstudianteOrLogin } from '@/app/demo/_shared/redirectDemoEstudianteOrLogin';

/** Índice demo: estudiante público comercial; coordinador solo por URL directa. */
export default function DemoIndexPage() {
  redirectDemoEstudianteOrLogin();
}
