'use client';

import { useEffect, useState, type CSSProperties } from 'react';

export type VoiceCard = {
  name: string;
  place: string;
  score: string;
  text: string;
  photo: string;
};

function columnCount(width: number) {
  if (width < 560) return 1;
  if (width < 980) return 2;
  return 3;
}

function splitVoices(items: VoiceCard[], count: number) {
  const columns: VoiceCard[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => {
    columns[index % count].push(item);
  });
  return columns;
}

function VoiceArticle({ item }: { item: VoiceCard }) {
  return (
    <article className="ag-voice-float">
      <header>
        {/* Foto remota de Google, de quien autorizó la publicación. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.photo} alt="" width={44} height={44} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        <span className="ag-voice-float-id">
          <strong>{item.name}</strong>
          <span>{item.place}</span>
        </span>
        <span className="ag-voice-score">{item.score}</span>
      </header>
      <blockquote>
        <p>“{item.text}”</p>
      </blockquote>
    </article>
  );
}

export function VoiceWall({ items, compact = false }: { items: VoiceCard[]; compact?: boolean }) {
  const [cols, setCols] = useState(3);

  useEffect(() => {
    const node = document.getElementById('voces-muro');
    if (!node) return undefined;
    const apply = () => setCols(columnCount(node.clientWidth));
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const columns = splitVoices(items, cols);

  return (
    <div
      id="voces-muro"
      className={compact ? 'ag-voice-wall is-compact' : 'ag-voice-wall'}
      style={{ '--ag-voice-cols': String(cols) } as CSSProperties}
      aria-label="Testimonios de estudiantes del Calendario A 2026"
    >
      {columns.map((column, index) => (
        <div key={index} className="ag-voice-col" data-dir={index % 2 === 0 ? 'up' : 'down'}>
          <div className="ag-voice-track">
            <div className="ag-voice-set">
              {column.map((item) => (
                <VoiceArticle key={`${item.name}-${item.score}`} item={item} />
              ))}
            </div>
            <div className="ag-voice-set" aria-hidden="true">
              {column.map((item) => (
                <VoiceArticle key={`${item.name}-${item.score}-copy`} item={item} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
