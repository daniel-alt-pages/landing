'use client';

import BlurText from '../bits/BlurText';

type Line = { text: string; accent?: boolean };

export function DisplayTitle({
  id,
  lines,
  onDark = false,
  as = 'h2',
}: {
  id?: string;
  lines: readonly Line[];
  onDark?: boolean;
  as?: 'h1' | 'h2';
}) {
  const Tag = as;
  return (
    <Tag id={id} className={as === 'h1' ? 'ag-display' : 'ag-h2'}>
      {lines.map((line, index) => (
        <BlurText
          key={`${line.text}-${index}`}
          as="span"
          className={[
            'ag-blur-line',
            line.accent ? (onDark ? 'ag-accent-line' : 'ag-accent') : '',
          ].filter(Boolean).join(' ')}
          text={line.text}
          delay={50 + index * 70}
          stepDuration={0.32}
          blur={8}
          distance={16}
        />
      ))}
    </Tag>
  );
}
