import { INSTAGRAM_FAVORITOS, INSTAGRAM_POSTS, INSTAGRAM_RESULTADOS_INTRO, VIDEO_ESTRATEGIAS, VIDEOS_RESULTADOS, type InstagramPost, type VideoItem } from '../../_contenido/videos';
import { CONTACTO } from '../../_contenido/contacto';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { ReelsVisor } from './ReelsVisor';

/** Orden del visor: Mariana, Ángel David, Sebastián, 3 estrategias. El reel de Gabriel no está en el repo como video. */
const REELS: VideoItem[] = [...VIDEOS_RESULTADOS, VIDEO_ESTRATEGIAS];

function VideoCard({ item }: { item: VideoItem }) {
  return (
    <figure className="ag-card ag-video-card">
      <div className="ag-video-frame">
        <video
          controls
          playsInline
          preload="none"
          poster={`/landing/videos/${item.id}.jpg`}
          aria-label={item.aria}
          width={720}
          height={1280}
        >
          <source src={`/landing/videos/${item.id}.mp4`} type="video/mp4" />
          {item.captions ? <track kind="captions" srcLang="es" label="Español" src={item.captions} /> : null}
          Su navegador no reproduce video.
        </video>
      </div>
      <figcaption>
        <h3 className="ag-h3">{item.title}</h3>
        <p>{item.caption}</p>
      </figcaption>
    </figure>
  );
}

function InstagramCard({ post }: { post: InstagramPost }) {
  return (
    <figure className="ag-card ag-ig-card">
      <a className="ag-ig-link" href={post.url} target="_blank" rel="noopener">
        <img className="ag-ig-img" src={`/landing/instagram/${post.code}.webp`} alt={post.alt} width={800} height={post.code.startsWith('DY') && !post.reel ? 1001 : 1000} loading="lazy" decoding="async" />
      </a>
      <figcaption>
        <h3 className="ag-h3">{post.title}</h3>
        <p>{post.caption}</p>
        <a className="ag-ig-more" href={post.url} target="_blank" rel="noopener">{post.reel ? 'Ver el reel en Instagram' : 'Ver la publicación en Instagram'}<span className="ag-ig-sr"> (se abre en una pestaña nueva)</span></a>
      </figcaption>
    </figure>
  );
}

/** Bloque «Resultados en video» (/resultados). */
export function VideoResultados() {
  return (
    <Section id="resultados-video" tone="white" label="resultados-video-title">
      <DisplayTitle id="resultados-video-title" lines={[{ text: 'Resultados' }, { text: 'en video', accent: true }]} />
      <Lead>Escúchelo de nuestros estudiantes.</Lead>
      <ReelsVisor items={REELS}>
        <div className="ag-video-grid">
          {VIDEOS_RESULTADOS.map((v) => <VideoCard key={v.id} item={v} />)}
        </div>
      </ReelsVisor>
      <div className="ag-ig-block" aria-labelledby="resultados-ig-title">
        <h3 id="resultados-ig-title" className="ag-h3 ag-ig-heading">Álbum de puntajes Calendario B 2026</h3>
        <p className="ag-ig-intro">{INSTAGRAM_RESULTADOS_INTRO} Sus nombres y sus palabras, publicados en nuestro Instagram.</p>
        <div className="ag-ig-grid">
          {INSTAGRAM_POSTS.map((p) => <InstagramCard key={p.code} post={p} />)}
        </div>
      </div>
      <div className="ag-ig-block ag-ig-favoritos" aria-labelledby="resultados-ig-fav-title">
        <h3 id="resultados-ig-fav-title" className="ag-h3 ag-ig-heading">Favoritos de nuestro Instagram</h3>
        <p className="ag-ig-intro">Puntajes reales del Calendario A 2025 y el mejor estudiante del Calendario B 2026. Usted puede ser el próximo.</p>
        <div className="ag-ig-grid ag-ig-grid-3">
          {INSTAGRAM_FAVORITOS.map((p) => <InstagramCard key={p.code} post={p} />)}
        </div>
        <p className="ag-ig-cta">
          <a className="ag-btn" href={CONTACTO.redes.instagram} target="_blank" rel="noopener">Ver más resultados en Instagram</a>
        </p>
      </div>
    </Section>
  );
}

/** Video de estrategias para estudiantes y familias (/programas). */
export function VideoEstrategias() {
  return (
    <Section id="video-estrategias" tone="paper" label="video-estrategias-title">
      <div className="ag-video-solo">
        <div>
          <DisplayTitle id="video-estrategias-title" lines={[{ text: 'Para estudiantes' }, { text: 'y familias', accent: true }]} />
          <Lead>Tres estrategias para el ICFES, explicadas en un minuto.</Lead>
        </div>
        <VideoCard item={VIDEO_ESTRATEGIAS} />
      </div>
    </Section>
  );
}
