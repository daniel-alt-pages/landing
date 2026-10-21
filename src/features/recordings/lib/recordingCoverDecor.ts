import type { CSSProperties } from 'react';

import type { LucideIcon } from 'lucide-react';

import {

  Atom,

  Beaker,

  BookMarked,

  BookOpen,

  Brain,

  Calculator,

  ChartLine,

  CircleDot,

  Compass,

  Divide,

  Dna,

  FileText,

  Flag,

  FlaskConical,

  FunctionSquare,

  Globe,

  Globe2,

  GraduationCap,

  Hash,

  Highlighter,

  Landmark,

  Languages,

  MessageCircle,

  Microscope,

  PenLine,

  Percent,

  Pi,

  Quote,

  Scale,

  Search,

  Sigma,

  SpellCheck,

  SquareRadical,

  Triangle,

  Users,

  Variable,

} from 'lucide-react';

import type { SgAreaKey } from '@shared/lib/sgAreaColors';

import { sgAreaColor } from '@shared/lib/sgAreaColors';



/** Lienzo de diseño fijo — escala uniforme vía container query en RecordingCoverArt. */

export const COVER_CANVAS_W = 640;

export const COVER_CANVAS_H = 360;



export type CoverFloaterIcon = {

  kind: 'icon';

  Icon: LucideIcon;

  x: number;

  y: number;

  size: number;

  opacity: number;

  rotate: number;

};



export type CoverFloaterBubble = {

  kind: 'bubble';

  x: number;

  y: number;

  size: number;

  opacity: number;

  rotate: number;

  label?: string;

  Icon?: LucideIcon;

  iconSize?: number;

};



export type CoverFloater = CoverFloaterIcon | CoverFloaterBubble;



export type CoverPatternKind = 'math' | 'lines' | 'orbit' | 'globe' | 'lang';



const AREA_FLOATERS: Record<SgAreaKey, CoverFloater[]> = {

  'lectura crítica': [

    { kind: 'bubble', x: 48, y: 52, size: 34, opacity: 0.92, rotate: -6, label: '«»' },

    { kind: 'icon', Icon: Quote, x: 118, y: 38, size: 16, opacity: 0.55, rotate: -12 },

    { kind: 'bubble', x: 168, y: 72, size: 30, opacity: 0.88, rotate: 8, label: 'TEXTO' },

    { kind: 'icon', Icon: FileText, x: 228, y: 48, size: 15, opacity: 0.48, rotate: 8 },

    { kind: 'icon', Icon: Search, x: 288, y: 92, size: 14, opacity: 0.42, rotate: -5 },

    { kind: 'bubble', x: 198, y: 128, size: 28, opacity: 0.85, rotate: -4, Icon: Highlighter, iconSize: 13 },

    { kind: 'icon', Icon: PenLine, x: 132, y: 118, size: 14, opacity: 0.45, rotate: -5 },

    { kind: 'icon', Icon: BookMarked, x: 252, y: 148, size: 13, opacity: 0.38, rotate: 10 },

    { kind: 'bubble', x: 88, y: 156, size: 26, opacity: 0.8, rotate: 6, label: 'idea' },

    { kind: 'icon', Icon: Brain, x: 312, y: 56, size: 13, opacity: 0.35, rotate: -8 },

    { kind: 'bubble', x: 338, y: 118, size: 32, opacity: 0.78, rotate: -10, label: 'ICFES' },

    { kind: 'icon', Icon: Highlighter, x: 368, y: 72, size: 12, opacity: 0.32, rotate: 14 },

  ],

  matemáticas: [

    { kind: 'bubble', x: 52, y: 44, size: 36, opacity: 0.92, rotate: -8, label: 'π' },

    { kind: 'icon', Icon: Sigma, x: 108, y: 36, size: 17, opacity: 0.58, rotate: -8 },

    { kind: 'bubble', x: 158, y: 78, size: 32, opacity: 0.9, rotate: 5, label: 'x²' },

    { kind: 'icon', Icon: Percent, x: 218, y: 52, size: 15, opacity: 0.5, rotate: 6 },

    { kind: 'icon', Icon: SquareRadical, x: 268, y: 98, size: 15, opacity: 0.48, rotate: 0 },

    { kind: 'bubble', x: 198, y: 132, size: 30, opacity: 0.86, rotate: -6, label: 'f(x)' },

    { kind: 'icon', Icon: Triangle, x: 128, y: 122, size: 14, opacity: 0.44, rotate: 0 },

    { kind: 'icon', Icon: Divide, x: 302, y: 44, size: 14, opacity: 0.42, rotate: -10 },

    { kind: 'bubble', x: 88, y: 158, size: 28, opacity: 0.82, rotate: 4, Icon: FunctionSquare, iconSize: 13 },

    { kind: 'icon', Icon: Pi, x: 248, y: 158, size: 14, opacity: 0.4, rotate: 8 },

    { kind: 'bubble', x: 328, y: 108, size: 34, opacity: 0.8, rotate: -12, label: '∫' },

    { kind: 'icon', Icon: ChartLine, x: 348, y: 58, size: 13, opacity: 0.36, rotate: -4 },

    { kind: 'bubble', x: 368, y: 142, size: 26, opacity: 0.75, rotate: 7, label: '%' },

  ],

  'sociales y ciudadanas': [

    { kind: 'bubble', x: 46, y: 48, size: 34, opacity: 0.9, rotate: -5, Icon: Landmark, iconSize: 15 },

    { kind: 'icon', Icon: Scale, x: 112, y: 40, size: 16, opacity: 0.55, rotate: 4 },

    { kind: 'bubble', x: 162, y: 82, size: 30, opacity: 0.88, rotate: 6, label: 'CSO' },

    { kind: 'icon', Icon: Users, x: 222, y: 54, size: 14, opacity: 0.48, rotate: -8 },

    { kind: 'icon', Icon: Flag, x: 278, y: 96, size: 14, opacity: 0.44, rotate: 10 },

    { kind: 'bubble', x: 188, y: 128, size: 28, opacity: 0.84, rotate: -4, label: '1808' },

    { kind: 'icon', Icon: Globe2, x: 132, y: 118, size: 14, opacity: 0.42, rotate: -6 },

    { kind: 'bubble', x: 92, y: 152, size: 26, opacity: 0.8, rotate: 8, label: '🇨🇴' },

    { kind: 'icon', Icon: Compass, x: 302, y: 48, size: 13, opacity: 0.38, rotate: 12 },

    { kind: 'bubble', x: 318, y: 112, size: 32, opacity: 0.78, rotate: -9, Icon: Scale, iconSize: 14 },

    { kind: 'icon', Icon: Landmark, x: 358, y: 68, size: 12, opacity: 0.34, rotate: -3 },

    { kind: 'bubble', x: 248, y: 162, size: 28, opacity: 0.76, rotate: 5, label: 'DDHH' },

  ],

  'ciencias naturales': [

    { kind: 'bubble', x: 50, y: 46, size: 36, opacity: 0.92, rotate: -7, Icon: Atom, iconSize: 16 },

    { kind: 'icon', Icon: Dna, x: 114, y: 38, size: 16, opacity: 0.56, rotate: 5 },

    { kind: 'bubble', x: 164, y: 76, size: 32, opacity: 0.9, rotate: 4, label: 'H₂O' },

    { kind: 'icon', Icon: Microscope, x: 224, y: 50, size: 15, opacity: 0.5, rotate: -4 },

    { kind: 'icon', Icon: Beaker, x: 272, y: 94, size: 14, opacity: 0.46, rotate: 8 },

    { kind: 'bubble', x: 196, y: 130, size: 30, opacity: 0.86, rotate: -5, label: 'ADN' },

    { kind: 'icon', Icon: FlaskConical, x: 128, y: 120, size: 14, opacity: 0.44, rotate: -8 },

    { kind: 'bubble', x: 86, y: 154, size: 28, opacity: 0.82, rotate: 6, label: 'E=mc²' },

    { kind: 'icon', Icon: CircleDot, x: 298, y: 46, size: 13, opacity: 0.4, rotate: -10 },

    { kind: 'bubble', x: 324, y: 108, size: 34, opacity: 0.8, rotate: -11, Icon: Microscope, iconSize: 14 },

    { kind: 'icon', Icon: Atom, x: 352, y: 64, size: 13, opacity: 0.36, rotate: 15 },

    { kind: 'bubble', x: 258, y: 160, size: 26, opacity: 0.76, rotate: 3, label: 'bio' },

  ],

  inglés: [

    { kind: 'bubble', x: 48, y: 50, size: 34, opacity: 0.9, rotate: -6, label: 'A1' },

    { kind: 'icon', Icon: MessageCircle, x: 110, y: 40, size: 16, opacity: 0.54, rotate: -7 },

    { kind: 'bubble', x: 160, y: 80, size: 32, opacity: 0.88, rotate: 5, label: 'verb' },

    { kind: 'icon', Icon: GraduationCap, x: 220, y: 52, size: 15, opacity: 0.48, rotate: 5 },

    { kind: 'icon', Icon: SpellCheck, x: 274, y: 96, size: 14, opacity: 0.44, rotate: -6 },

    { kind: 'bubble', x: 192, y: 128, size: 30, opacity: 0.85, rotate: -4, label: 'B2' },

    { kind: 'icon', Icon: Languages, x: 130, y: 118, size: 14, opacity: 0.42, rotate: -6 },

    { kind: 'bubble', x: 90, y: 154, size: 28, opacity: 0.8, rotate: 7, label: 'Hi!' },

    { kind: 'icon', Icon: BookOpen, x: 248, y: 156, size: 13, opacity: 0.38, rotate: 9 },

    { kind: 'bubble', x: 316, y: 56, size: 32, opacity: 0.78, rotate: -8, label: 'to be' },

    { kind: 'icon', Icon: Hash, x: 342, y: 114, size: 13, opacity: 0.35, rotate: 4 },

    { kind: 'bubble', x: 362, y: 72, size: 26, opacity: 0.74, rotate: 10, Icon: Variable, iconSize: 13 },

  ],

};



const AREA_WATERMARK: Record<SgAreaKey, LucideIcon> = {

  'lectura crítica': BookOpen,

  matemáticas: Calculator,

  'sociales y ciudadanas': Globe,

  'ciencias naturales': FlaskConical,

  inglés: Languages,

};



const AREA_PATTERN: Record<SgAreaKey, CoverPatternKind> = {

  'lectura crítica': 'lines',

  matemáticas: 'math',

  'sociales y ciudadanas': 'globe',

  'ciencias naturales': 'orbit',

  inglés: 'lang',

};



/** Patrones CSS puros — sin imágenes ni red. */

export const COVER_PATTERN_STYLES: Record<CoverPatternKind, CSSProperties> = {

  math: {

    backgroundImage: [

      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',

      'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',

    ].join(', '),

    backgroundSize: '22px 22px',

  },

  lines: {

    backgroundImage: [

      'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',

      'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',

    ].join(', '),

    backgroundSize: '100% 11px, 100% 22px',

  },

  orbit: {

    backgroundImage: [

      'radial-gradient(circle at 72% 38%, rgba(255,255,255,0.05) 0%, transparent 28%)',

      'radial-gradient(circle at 72% 38%, transparent 42%, rgba(255,255,255,0.04) 43%, transparent 44%)',

      'radial-gradient(circle at 72% 38%, transparent 58%, rgba(255,255,255,0.03) 59%, transparent 60%)',

    ].join(', '),

  },

  globe: {

    backgroundImage: [

      'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.04) 18px, rgba(255,255,255,0.04) 19px)',

      'repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(255,255,255,0.03) 24px, rgba(255,255,255,0.03) 25px)',

    ].join(', '),

  },

  lang: {

    backgroundImage:

      'repeating-linear-gradient(-35deg, transparent, transparent 16px, rgba(255,255,255,0.025) 16px, rgba(255,255,255,0.025) 17px)',

  },

};



export function recordingCoverPattern(areaKey: string): CoverPatternKind {

  const c = sgAreaColor(areaKey);

  return AREA_PATTERN[c.key as SgAreaKey] ?? 'lines';

}



export function recordingCoverWatermarkIcon(areaKey: string): LucideIcon {

  const c = sgAreaColor(areaKey);

  return AREA_WATERMARK[c.key as SgAreaKey] ?? BookOpen;

}



/** Floaters temáticos en coords fijas del lienzo 640×360. */

export function recordingCoverFloaters(areaKey: string, compact: boolean): CoverFloater[] {

  const c = sgAreaColor(areaKey);

  const list = AREA_FLOATERS[c.key as SgAreaKey] ?? AREA_FLOATERS['lectura crítica'];

  return compact ? list.slice(0, 10) : list;

}



/** @deprecated usar recordingCoverFloaters */

export function recordingCoverFloatingIcons(areaKey: string, compact: boolean) {

  return recordingCoverFloaters(areaKey, compact).filter(

    (f): f is CoverFloaterIcon => f.kind === 'icon',

  );

}


