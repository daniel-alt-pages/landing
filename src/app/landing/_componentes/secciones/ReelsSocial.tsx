'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Heart, MessageCircle, Share2, X } from 'lucide-react';
import {
  COMMENT_LIMITS,
  REELS_SOCIAL_ENABLED,
  getReelsSocialAdapter,
  isNoopAdapter,
  validateComment,
  type ReelsComment,
} from '../../_lib/reelsSocial';

type Counts = { likes: number; comments: number; likedByMe: boolean };

/** URL pública de un video del visor. */
export function reelsShareUrl(slug: string) {
  return `${window.location.origin}/landing/#video=${slug}`;
}

/** Columna vertical estilo Reels: compartir, me gusta y comentarios. Sin cifras inventadas. */
export function ReelsSocialColumn({ slug, title, onSheet }: { slug: string; title: string; onSheet: (open: boolean) => void }) {
  const adapter = getReelsSocialAdapter();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [liked, setLiked] = useState(false);
  const [notice, setNotice] = useState('');
  const [sheet, setSheet] = useState(false);
  const commentBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!REELS_SOCIAL_ENABLED) return;
    let alive = true;
    adapter.getCounts(slug).then(
      (c) => { if (!alive) return; setCounts(c); setLiked(!!c?.likedByMe); },
      () => { if (alive) { setCounts(null); setLiked(false); } },
    );
    return () => { alive = false; };
  }, [adapter, slug]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(''), 2500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const share = async () => {
    const url = reelsShareUrl(slug);
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title, url }); return; } catch (e) { if ((e as DOMException)?.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); setNotice('Enlace copiado'); } catch { setNotice('No se pudo copiar el enlace'); }
  };

  const like = async () => {
    const prev = { liked, counts };
    const next = !liked;
    setLiked(next);
    if (counts) setCounts({ ...counts, likes: Math.max(0, counts.likes + (next ? 1 : -1)), likedByMe: next });
    try {
      const r = await adapter.toggleLike(slug);
      setLiked(r.liked);
      setCounts((c) => (c ? { ...c, likes: r.likes, likedByMe: r.liked } : c));
    } catch {
      setLiked(prev.liked);
      setCounts(null);
    }
  };

  const openSheet = (open: boolean) => {
    setSheet(open);
    onSheet(open);
    if (open) adapter.openComments(slug);
    else window.setTimeout(() => commentBtn.current?.focus({ preventScroll: true }), 0);
  };

  return (
    <>
      <div className="ag-reels-social">
        {REELS_SOCIAL_ENABLED ? (<>
        <button type="button" className="ag-reels-btn ag-reels-social-btn" onClick={like} aria-pressed={liked} aria-label={liked ? 'Quitar su me gusta de este video' : 'Darle me gusta a este video'}>
          <Heart aria-hidden size={26} fill={liked ? 'currentColor' : 'none'} />
          {counts ? <span className="ag-reels-social-n">{counts.likes}</span> : null}
        </button>
        <button ref={commentBtn} type="button" className="ag-reels-btn ag-reels-social-btn" onClick={() => openSheet(true)} aria-label="Ver y escribir comentarios de este video" aria-haspopup="dialog">
          <MessageCircle aria-hidden size={26} />
          {counts ? <span className="ag-reels-social-n">{counts.comments}</span> : null}
        </button>
        </>) : null}
        <button type="button" className="ag-reels-btn ag-reels-social-btn" onClick={share} aria-label="Compartir el enlace de este video">
          <Share2 aria-hidden size={26} />
        </button>
      </div>
      <div className="ag-reels-toast" role="status" aria-live="polite">{notice ? <span>{notice}</span> : null}</div>
      {REELS_SOCIAL_ENABLED && sheet ? <CommentsSheet slug={slug} onClose={() => openSheet(false)} /> : null}
    </>
  );
}

function CommentsSheet({ slug, onClose }: { slug: string; onClose: () => void }) {
  const adapter = getReelsSocialAdapter();
  const noop = isNoopAdapter(adapter);
  const ref = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ReelsComment[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [website, setWebsite] = useState('');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button, input, textarea')?.focus({ preventScroll: true });
    if (noop) return;
    let alive = true;
    adapter.listComments(slug).then((l) => { if (alive) setList(l); }, () => { if (alive) setList([]); });
    return () => { alive = false; };
  }, [adapter, noop, slug]);

  const onKey = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key !== 'Tab') return;
    const nodes = ref.current?.querySelectorAll<HTMLElement>('button, input:not([tabindex="-1"]), textarea');
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateComment(name, text);
    if (v === 'name') { setMsg(`Escriba un nombre de ${COMMENT_LIMITS.nameMin} a ${COMMENT_LIMITS.nameMax} caracteres.`); return; }
    if (v === 'text') { setMsg(`Escriba un comentario de ${COMMENT_LIMITS.textMin} a ${COMMENT_LIMITS.textMax} caracteres.`); return; }
    setSending(true);
    try {
      const r = await adapter.submitComment(slug, { name: name.trim(), text: text.trim(), website });
      if ('status' in r) { setMsg('Su comentario será revisado antes de publicarse.'); setText(''); }
      else if (r.error === 'rate_limited') setMsg('Ha enviado varios comentarios seguidos. Intente de nuevo en unos minutos.');
      else setMsg('No pudimos recibir su comentario. Revise el nombre y el texto e intente de nuevo.');
    } catch {
      setMsg('No pudimos enviar su comentario. Intente de nuevo más tarde.');
    } finally { setSending(false); }
  };

  return (
    <div className="ag-reels-sheet-backdrop" onClick={onClose}>
      <div ref={ref} className="ag-reels-sheet" role="dialog" aria-modal="true" aria-labelledby="ag-reels-sheet-title" onClick={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="ag-reels-sheet-head">
          <h2 id="ag-reels-sheet-title" className="ag-reels-sheet-title">Comentarios</h2>
          <button type="button" className="ag-reels-btn" onClick={onClose} aria-label="Cerrar los comentarios"><X aria-hidden size={24} /></button>
        </div>
        {noop ? (
          <p className="ag-reels-sheet-msg">Los comentarios estarán disponibles pronto.</p>
        ) : (
          <>
            {list.length > 0 ? (
              <ul className="ag-reels-sheet-list">
                {list.map((c) => <li key={c.id}><strong>{c.name}</strong><p>{c.text}</p></li>)}
              </ul>
            ) : null}
            <form className="ag-reels-sheet-form" onSubmit={submit} noValidate>
              <label>Su nombre<input value={name} onChange={(e) => setName(e.target.value)} maxLength={COMMENT_LIMITS.nameMax} autoComplete="name" required /></label>
              <label>Su comentario<textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={COMMENT_LIMITS.textMax} rows={3} required /></label>
              <input className="ag-reels-hp" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} aria-hidden="true" autoComplete="off" />
              <button type="submit" className="ag-reels-sheet-send" disabled={sending}>Enviar comentario</button>
            </form>
            <p className="ag-reels-sheet-msg" role="status" aria-live="polite">{msg}</p>
          </>
        )}
      </div>
    </div>
  );
}
