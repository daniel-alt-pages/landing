import type { Metadata } from 'next';
import Link from 'next/link';
import BlurText from '../_componentes/bits/BlurText';
import { FOOTER } from '../_contenido/footer';

export const metadata: Metadata = {
  title: { absolute: 'Política de datos | Alianza SEAMOSGENIOS' },
  description: 'Tratamiento de datos personales en la alianza SEAMOSGENIOS, según la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
};

export default function PoliticaPage() {
  return (
    <section className="ag-section ag-tone-paper">
      <article className="ag-wrap ag-legal">
        <p className="ag-eyebrow">Ley 1581 de 2012 · Decreto 1377 de 2013</p>
        <h1 className="ag-h2">
          <BlurText as="span" className="ag-blur-line" text="Política de tratamiento" delay={40} blur={8} distance={12} />
          <BlurText as="span" className="ag-blur-line ag-accent" text="de datos" delay={80} blur={8} distance={12} />
        </h1>
        <p>
          SEAMOSGENIOS SAS trata los datos que usted registra en esta página para responder su solicitud de reunión o de simulacro gratuito, y para contactarle por WhatsApp, teléfono o correo electrónico.
        </p>
        <h2 className="ag-h3">Datos que solicitamos</h2>
        <p>Nombre, cargo, institución, departamento, municipio, rango de estudiantes de grado 11, WhatsApp y, de forma opcional, correo electrónico. También registramos la procedencia de la visita y la página de origen.</p>
        <h2 className="ag-h3">Finalidad</h2>
        <p>Contactar a su institución, agendar la reunión de 30 minutos y coordinar el simulacro gratuito. No vendemos ni cedemos esta información a terceros.</p>
        <h2 className="ag-h3">Conservación</h2>
        <p>Conservamos el registro mientras la relación comercial esté vigente y durante el tiempo que exija la ley. Usted puede solicitar la supresión en cualquier momento.</p>
        <h2 className="ag-h3">Sus derechos</h2>
        <p>
          Usted puede conocer, actualizar, rectificar y suprimir sus datos, y revocar la autorización otorgada. Para ejercer estos derechos escriba a{' '}
          <a href={`mailto:${FOOTER.correo}`}>{FOOTER.correo}</a>.
        </p>
        <h2 className="ag-h3">Testimonios e imágenes</h2>
        <p>Los testimonios, puntajes y fotografías de estudiantes publicados en este sitio cuentan con la autorización expresa de sus autores, otorgada en el formulario de registro de puntajes.</p>
        <h2 className="ag-h3">Responsable del tratamiento</h2>
        <p>
          SEAMOSGENIOS SAS
          {FOOTER.nit ? ` · NIT ${FOOTER.nit}` : ''}
          {FOOTER.direccion ? ` · ${FOOTER.direccion}` : ''} · {FOOTER.correo}
        </p>
        <h2 className="ag-h3">Analítica</h2>
        <p>
          Google Analytics solo se carga si acepta analítica y el sitio tiene un identificador. Meta Pixel solo se carga si acepta publicidad y hay un identificador. Si las rechaza, no enviamos eventos a esos servicios. El carrito y la elección de cookies sí se guardan, porque hacen funcionar la página. Su solicitud se procesa igual en ambos casos.
        </p>
        <p>
          <Link className="ag-text-link" href="/landing">
            Volver a la alianza
          </Link>
        </p>
      </article>
    </section>
  );
}
