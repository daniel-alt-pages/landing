'use client';

import { useEffect, useState } from 'react';
import {
  COMENTARIOS_API_URL,
  COMENTARIOS_REQUIERE_SESION,
  leerSesion,
  loginParaComentar,
  postComentario,
  puedeComentar,
  type SesionPlataforma,
} from '../../_lib/comentarios';
import { Avatar } from '../../_componentes/bits/Avatar';

export function DejaOpinion({ programaId }: { programaId: string }) {
  const [sesion, setSesion] = useState<SesionPlataforma | null>(null);
  const [volver, setVolver] = useState('');
  const [estrellas, setEstrellas] = useState(0);
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('');
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { setSesion(leerSesion()); setVolver(window.location.href); });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const habilitado = puedeComentar(sesion);
  const demo = !COMENTARIOS_API_URL;
  const listo = habilitado && estrellas > 0 && texto.trim().length >= 5;

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    if (!listo) return;
    if (demo) {
      setEstado('Ejemplo ilustrativo: su opinión no se publicó. Publicación disponible pronto.');
      return;
    }
    const ok = await postComentario({ programaId, estrellas, texto, autor: sesion }).catch(() => false);
    setEstado(ok ? 'Gracias. Su opinión fue enviada.' : 'No pudimos enviar su opinión. Intente de nuevo.');
    if (ok) { setTexto(''); setEstrellas(0); }
  }

  return (
    <section className="ag-fx-card ag-fx-block" aria-labelledby="fx-deja">
      <h2 id="fx-deja">Deja tu opinión <span className="ag-fx-tag">Ejemplo ilustrativo</span></h2>
      {sesion ? (
        <p className="ag-fx-author">
          <Avatar name={sesion.nombre} src={sesion.foto} />
          <strong>{sesion.nombre}</strong>
        </p>
      ) : null}
      {!habilitado ? (
        <div className="ag-fx-login">
          <p>Para comentar, inicie sesión. Así su opinión aparece con su nombre y foto de perfil.</p>
          <a className="ag-store-secondary" href={loginParaComentar(volver)}>Iniciar sesión</a>
        </div>
      ) : null}
      <form onSubmit={enviar} className="ag-fx-form">
        <fieldset disabled={!habilitado}>
          <legend>Su calificación</legend>
          <div className="ag-fx-rate" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={estrellas === n}
                aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                className={estrellas >= n ? 'on' : ''} onClick={() => setEstrellas(n)}>★</button>
            ))}
          </div>
          <label htmlFor="fx-texto">Su opinión</label>
          <textarea id="fx-texto" rows={4} value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder="Cuéntenos cómo le fue con el programa" />
          <button type="submit" className="ag-store-primary" disabled={!listo}>Publicar opinión</button>
          {demo ? <p className="ag-fx-note">Publicación disponible pronto. {COMENTARIOS_REQUIERE_SESION ? '' : 'Este formulario es una demostración.'}</p> : null}
        </fieldset>
      </form>
      <p className="ag-fx-note" role="status" aria-live="polite">{estado}</p>
    </section>
  );
}
