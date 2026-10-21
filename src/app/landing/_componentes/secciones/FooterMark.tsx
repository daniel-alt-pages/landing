'use client';

import { Geist } from 'next/font/google';
import TechText from './TechText';

const geist = Geist({ subsets: ['latin'], weight: '600', display: 'swap' });

export function FooterMark() {
  return (
    <div className={`ag-footer-mark ${geist.className}`}>
      <TechText
        text="SeamosGenios"
        fontFamily={geist.style.fontFamily}
        fontWeight={600}
        fontSize={124}
        letterSpacing={-0.05}
        color="#ffffff"
        accentColor="#CC0000"
        reveal="letter"
        dashLength={4}
        dashGap={2}
        specks={15}
      />
    </div>
  );
}
