'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CONTACTO } from '../_contenido/contacto';
import { track } from '../_lib/analytics';
import BlurText from '../_componentes/bits/BlurText';
import { buildWaUrl, WA_TEXT } from '../_lib/whatsapp';

export function GraciasView() {
  const search = useSearchParams();
  const simulacro = search.get('tipo') === 'simulacro';

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; event?: string } | string | null;
      const kind = typeof data === 'string' ? data : data?.type || data?.event;
      if (kind === 'bookingSuccessful' || kind === 'booking_successful') track('schedule_meeting');
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <section className="ag-section ag-tone-paper">
      <div className="ag-wrap" style={{ maxWidth: 720 }}>
        <p className="ag-eyebrow">Solicitud recibida</p>
        <h1 className="ag-display ag-display-sm">
          <BlurText as="span" align="start" className="ag-blur-line" text="Gracias por su" delay={40} blur={8} distance={12} />
          <BlurText as="span" align="start" className="ag-blur-line ag-accent" text="interés" delay={80} blur={8} distance={12} />
        </h1>
        <p className="ag-lead">
          {simulacro
            ? 'Un asesor le escribirá en el próximo día hábil para coordinar la fecha del simulacro en la plataforma y entregarle el material en PDF.'
            : 'El siguiente paso es una reunión de 30 minutos en la que le mostramos la plataforma en vivo. Elija el horario que mejor le convenga.'}
        </p>
        {CONTACTO.bookingUrl ? (
          <>
            <iframe title="Agenda de 30 minutos" src={CONTACTO.bookingUrl} className="ag-booking" />
            <p>
              <a className="ag-btn" href={CONTACTO.bookingUrl} target="_blank" rel="noreferrer" onClick={() => track('schedule_meeting')}>
                Abrir la agenda en otra pestaña
              </a>
            </p>
          </>
        ) : (
          <p>Un asesor le contactará en el próximo día hábil para acordar el horario. Si prefiere adelantarlo, escríbanos ahora.</p>
        )}
        <div className="ag-actions">
          <a className="ag-btn" href={buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.cta_final)}>
            Continuar por WhatsApp
          </a>
          <a className="ag-btn-ghost" href="/landing/plataforma">
            Conocer la plataforma
          </a>
        </div>
      </div>
    </section>
  );
}
