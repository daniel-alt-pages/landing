'use client';

import { track } from '../../_lib/analytics';

export function Accordion({ items }: { items: readonly { question: string; answer: string }[] }) {
  return (
    <div className="ag-accordion">
      {items.map((item, index) => (
        <details
          key={item.question}
          className="ag-card"
          open={index === 0}
          onToggle={(event) => {
            if ((event.currentTarget as HTMLDetailsElement).open) track('faq_open', { q: item.question.slice(0, 80) });
          }}
        >
          <summary className="ag-h3 ag-accordion-q">{item.question}</summary>
          <p className="ag-accordion-a">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
