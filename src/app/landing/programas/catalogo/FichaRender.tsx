import type { FichaBlock, FichaInclude, FichaQuestion, ProductFicha, SheetSection } from './catalogUi';
import { ProductFacts } from './ProductFacts';
import { Marks } from './marks';

type Props = { ficha: ProductFicha };

function asInclude(item: FichaInclude | FichaQuestion | string): FichaInclude | null {
  if (typeof item === 'string') return item ? { label: item } : null;
  if ('label' in item || 'note' in item) return item;
  return null;
}

function asQuestion(item: FichaInclude | FichaQuestion | string): FichaQuestion | null {
  if (!item || typeof item === 'string' || !('q' in item || 'a' in item)) return null;
  return item;
}

function BloqueIntro({ block }: { block: FichaBlock }) {
  if (!block.title && !block.body) return null;
  return (
    <section className="ag-ficha-intro">
      {block.title ? <h3>{block.title}</h3> : null}
      {block.body ? <p><Marks text={block.body} /></p> : null}
    </section>
  );
}

function BloqueIncluye({ block }: { block: FichaBlock }) {
  const items = (block.items || []).map(asInclude).filter((item): item is FichaInclude => Boolean(item && (item.label || item.note)));
  if (!items.length) return null;
  return (
    <section className="ag-ficha-incluye">
      <h3>Qué incluye</h3>
      <div>
        {items.map((item, index) => (
          <article key={`${item.label}-${index}`}>
            <h4>{item.label}</h4>
            {item.note ? <p><Marks text={item.note} /></p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function BloqueImagen({ block }: { block: FichaBlock }) {
  if (!block.url) return null;
  return (
    <figure className={block.ratio === '1:1' ? 'ag-ficha-imagen is-square' : 'ag-ficha-imagen'}>
      <img src={block.url} alt={block.caption || ''} />
      {block.caption ? <figcaption>{block.caption}</figcaption> : null}
    </figure>
  );
}

function BloqueTexto({ block }: { block: FichaBlock }) {
  if (!block.body) return null;
  return (
    <section className={`ag-ficha-texto is-${block.style || 'cuerpo'}`}>
      <p><Marks text={block.body} /></p>
    </section>
  );
}

function BloqueAreas({ block }: { block: FichaBlock }) {
  const items = (block.items || []).map((item) => (typeof item === 'string' ? item : ('label' in item ? item.label : ''))).filter(Boolean);
  if (!items.length) return null;
  return (
    <section className="ag-ficha-areas">
      {items.map((item) => <p key={item}>{item}</p>)}
    </section>
  );
}

function BloqueHorario({ block }: { block: FichaBlock }) {
  const sections = (block.sections || []) as SheetSection[];
  return (
    <ProductFacts sheet={{
      headline: block.headline,
      duration: block.duration,
      columns: block.columns,
      sections,
    }}
    />
  );
}

function BloquePreguntas({ block }: { block: FichaBlock }) {
  const items = (block.items || []).map(asQuestion).filter((item): item is FichaQuestion => Boolean(item && (item.q || item.a)));
  if (!items.length) return null;
  return (
    <section className="ag-ficha-faq">
      {items.map((item, index) => (
        <details key={`${item.q}-${index}`} open={index === 0}>
          <summary>{item.q || 'Pregunta'}</summary>
          {item.a ? <p><Marks text={item.a} /></p> : null}
        </details>
      ))}
    </section>
  );
}

function BloqueLlamado({ block }: { block: FichaBlock }) {
  if (!block.label && !block.note) return null;
  return (
    <aside className="ag-ficha-call">
      {block.label ? <strong>{block.label}</strong> : null}
      {block.note ? <p>{block.note}</p> : null}
    </aside>
  );
}

const RENDER: Record<string, (block: FichaBlock) => ReturnType<typeof BloqueIntro>> = {
  intro: (block) => <BloqueIntro block={block} />,
  incluye: (block) => <BloqueIncluye block={block} />,
  imagen: (block) => <BloqueImagen block={block} />,
  texto: (block) => <BloqueTexto block={block} />,
  areas: (block) => <BloqueAreas block={block} />,
  horario: (block) => <BloqueHorario block={block} />,
  preguntas: (block) => <BloquePreguntas block={block} />,
  llamado: (block) => <BloqueLlamado block={block} />,
};

export function FichaRender({ ficha }: Props) {
  const cover = ficha.cover?.wide || ficha.cover?.square || '';
  const square = !ficha.cover?.wide && !!ficha.cover?.square;
  return (
    <div className="ag-ficha">
      {cover ? (
        <figure className={square ? 'ag-ficha-imagen is-square' : 'ag-ficha-imagen'}>
          <img src={cover} alt={ficha.cover?.alt || ''} />
        </figure>
      ) : null}
      {(ficha.blocks || []).map((block) => {
        const render = RENDER[block.type];
        return render ? <div key={block.id}>{render(block)}</div> : null;
      })}
    </div>
  );
}
