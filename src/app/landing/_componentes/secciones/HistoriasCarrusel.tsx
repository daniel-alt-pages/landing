'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { HISTORIAS, type Historia } from '../../_contenido/historias';
import { DepthCarousel } from './DepthCarousel';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

function StoryViewer({
  story,
  index,
  onIndex,
  onClose,
}: {
  story: Historia;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const image = story.images[index];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') onIndex((index + 1) % story.images.length);
      if (event.key === 'ArrowLeft') onIndex((index - 1 + story.images.length) % story.images.length);
    };
    dialog.addEventListener('keydown', onKey);
    return () => dialog.removeEventListener('keydown', onKey);
  }, [index, onIndex, story.images.length]);

  return (
    <dialog
      ref={ref}
      className="ag-story-full"
      aria-label={image.alt}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <img
        src={image.src}
        alt={image.alt}
        onClick={(event) => {
          event.stopPropagation();
          onIndex((index + 1) % story.images.length);
        }}
      />
    </dialog>
  );
}

function mover(event: KeyboardEvent<HTMLDivElement>, active: string, onPick: (id: string) => void) {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const index = HISTORIAS.findIndex((item) => item.id === active);
  const next =
    event.key === 'Home' ? 0
    : event.key === 'End' ? HISTORIAS.length - 1
    : event.key === 'ArrowRight' ? (index + 1) % HISTORIAS.length
    : (index - 1 + HISTORIAS.length) % HISTORIAS.length;
  onPick(HISTORIAS[next].id);
  const button = event.currentTarget.querySelectorAll('button')[next];
  if (button instanceof HTMLButtonElement) button.focus();
}

function Rail({ story }: { story: Historia }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <article className="ag-story" id="alianza-story" role="tabpanel" aria-labelledby={`alianza-tab-${story.id}`}>
      <div className="ag-story-copy">
        <h3>{story.title}</h3>
        <p>{story.text}</p>
        <a href={story.href} target="_blank" rel="noreferrer">Ver la publicación</a>
      </div>
      <div className="ag-story-depth">
        <DepthCarousel
          label={story.title}
          items={story.images.map((image) => ({ image: image.src, alt: image.alt }))}
          cardWidth={460}
          cardHeight={400}
          radius={20}
          spread={64}
          depth={36}
          tilt={6}
          visibleCards={2}
          falloff={0.14}
          blur={14}
          align="start"
          autoplay
          loop
          onActivate={setOpen}
        />
      </div>
      {open !== null ? (
        <StoryViewer story={story} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      ) : null}
    </article>
  );
}

export function HistoriasCarrusel() {
  const [active, setActive] = useState(HISTORIAS[1].id);
  const story = HISTORIAS.find((item) => item.id === active) ?? HISTORIAS[0];

  return (
    <Section id="alianzas" tone="white" label="alianzas-title">
      <p className="ag-eyebrow">En el territorio</p>
      <DisplayTitle id="alianzas-title" lines={[{ text: 'Alianzas que' }, { text: 'van más allá del simulacro', accent: true }]} />
      <Lead>Resultados del Saber 11, acompañamiento en el aula y el trabajo con secretarías, universidades e instituciones.</Lead>
      <div
        className="ag-story-nav"
        role="tablist"
        aria-label="Historias en el territorio"
        onKeyDown={(event) => mover(event, active, setActive)}
      >
        {HISTORIAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`alianza-tab-${item.id}`}
            aria-selected={item.id === active}
            aria-controls="alianza-story"
            tabIndex={item.id === active ? 0 : -1}
            onClick={() => setActive(item.id)}
          >
            {item.chip}
          </button>
        ))}
      </div>
      <div className="ag-story-list">
        <Rail key={story.id} story={story} />
      </div>
    </Section>
  );
}
