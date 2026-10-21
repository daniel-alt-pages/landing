export type Confirmable = {
  /** Si existe, el dato no está listo para producción. verify-landing-content.mjs falla con ALIANZA_STRICT=1. */
  confirmar?: string;
};

export type Stat = Confirmable & {
  id: string;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  note: string;
};

export type TeamMember = Confirmable & {
  id: string;
  name: string;
  role: string;
  years: string;
  bio: string;
  featured?: boolean;
};

export type AreaScores = [number, number, number, number, number];

export type ResultCard = Confirmable & {
  id: string;
  name: string;
  city: string;
  global: number;
  areas?: AreaScores;
  from?: number;
  detail?: string;
};

export type SchoolLogo = Confirmable & {
  id: string;
  name: string;
  short: string;
  department: string;
  src: string;
};
