import BlurText from '../bits/BlurText';

export function CtaStrip({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <aside className="ag-cta-strip">
      <div className="ag-wrap ag-cta-strip-inner">
        <div>
          <h2 className="ag-h3">
            <BlurText as="span" align="start" className="ag-blur-line" text={title} delay={40} blur={6} distance={10} />
          </h2>
          <p>{text}</p>
        </div>
        <a className="ag-btn" href={href}>
          {cta}
        </a>
      </div>
    </aside>
  );
}
