'use client';

import { useRef, type ReactNode } from 'react';

/** Modal accesible con <dialog> nativo: foco atrapado (inert), Esc cierra, clic en fondo cierra, foco vuelve al disparador. */
export function ModalB2b({ boton, titulo, etiqueta, children }: { boton: string; titulo: string; etiqueta: string; children: ReactNode }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const origen = useRef<HTMLButtonElement>(null);
  const id = `mb-${etiqueta.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <>
      <button ref={origen} type="button" className="b2m-abrir" aria-haspopup="dialog" onClick={() => dlg.current?.showModal()}>{boton}</button>
      <dialog ref={dlg} className="b2m-modal" aria-labelledby={id}
        onClose={() => origen.current?.focus()}
        onClick={(e) => { if (e.target === dlg.current) dlg.current?.close(); }}>
        <div className="b2m-in">
          <p className="b2m-tab">{etiqueta}</p>
          <h3 id={id}>{titulo}</h3>
          {children}
          <div className="b2m-acc">
            <a className="ag-b2b-btn" href="#solicitar-reunion" onClick={() => dlg.current?.close()}>Agendar reunión</a>
            <button type="button" className="b2p-link" autoFocus onClick={() => dlg.current?.close()}>Cerrar</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
