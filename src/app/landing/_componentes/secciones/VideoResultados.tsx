import { VIDEO_ESTRATEGIAS, VIDEOS_RESULTADOS, type VideoItem } from '../../_contenido/videos';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

function VideoCard({ item }: { item: VideoItem }) {
  return (
    <figure className="ag-card ag-video-card">
      <div className="ag-video-frame">
        <video
          controls
          muted
          playsInline
          preload="none"
          poster={`/landing/videos/${item.id}.jpg`}
          aria-label={item.aria}
          width={720}
          height={1280}
        >
          <source src={`/landing/videos/${item.id}.mp4`} type="video/mp4" />
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

/** Bloque «Resultados en video» (/resultados). */
export function VideoResultados() {
  return (
    <Section id="resultados-video" tone="white" label="resultados-video-title">
      <DisplayTitle id="resultados-video-title" lines={[{ text: 'Resultados' }, { text: 'en video', accent: true }]} />
      <Lead>Escúchelo de nuestros estudiantes.</Lead>
      <div className="ag-video-grid">
        {VIDEOS_RESULTADOS.map((v) => <VideoCard key={v.id} item={v} />)}
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
