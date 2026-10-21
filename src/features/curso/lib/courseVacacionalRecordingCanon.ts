/** Metadatos canónicos por Drive file (corrige títulos ICS/Drive desalineados). */
export type VacacionalRecordingCanon = {
  title: string;
  recordedAt: string;
  geminiDocId?: string;
};

export const VACACIONAL_RECORDING_CANON_BY_DRIVE: Record<string, VacacionalRecordingCanon> = {
  '1nRxd1TrN0MuMBH5jcUCU8TrZoL9Edng-': {
    title: 'PREICFES VACACIONAL - INDUCCIÓN ESPECIFICA - INGLÉS',
    recordedAt: '2026-06-03',
    geminiDocId: '1aPCZmlBnh7_rgwJZFDS4MxVgueEC5EdAUyegqR83oJM',
  },
  '1Kgi5OeJaik0EMNxoSUiJAKu1j7Tqv89_': {
    title: 'PREICFES VACACIONAL - INDUCCIÓN ESPECIFICA - LECTURA CRÍTICA',
    recordedAt: '2026-06-04',
    geminiDocId: '1bdC2yMpuqDValwt_o1zzFzhnEdc1WDVhUeAxweLlaGk',
  },
  '1sZikyDK7Nt6I_sOxQY41PEgvdequnj3r': {
    title: 'PREICFES VACACIONAL - INDUCCIÓN ESPECIFICA - COMPETENCIAS CIUDADANAS',
    recordedAt: '2026-06-04',
    geminiDocId: '1iVtQKzCp5GZOjX8VoUriE2YTZD_CrP0ROdFQ7OA0088',
  },
  '1YZ0MUXiZbInOBjj5mdWC3Wp3pJPyErLn': {
    title: 'PREICFES VACACIONAL - INDUCCIÓN ESPECIFICA - CIENCIAS NATURALES',
    recordedAt: '2026-06-04',
    geminiDocId: '10eDj-dwgsdJ7uYct394nwHwFRChzp9nvxMSZuLVvaB8',
  },
  '1tGQ3-QZ2drfx6QY0dejTFE1DgiRIoVxJ': {
    title: 'PREICFES VACACIONAL - INDUCCIÓN ESPECIFICA - MATEMÁTICAS',
    recordedAt: '2026-06-05',
    geminiDocId: '1GjuSsPkHSQ3q_JeL59iG5JA7Kwr8qcIlJ5Qq532WfI4',
  },
  '1bwl5Pm_hUuFBhnr3Q0NFavVdmYsZ5_UL': {
    title: 'PREICFES VACACIONAL - INDUCCIÓN ESPECIFICA - PLATAFORMA DE SIMULACROS',
    recordedAt: '2026-06-06',
    geminiDocId: '1sKrYKV-fhpbbeWI09z-gNNtw8abBRvNRbsMTXa1Ai5I',
  },
  '1VxL-MF5G53vGtLuQowCIhcg04n8pqE_O': {
    title:
      'PREICFES VACACIONAL - CLASE #1 - RANGO DE PREGUNTAS (1 A 24) - AREA (COMPETENCIAS CIUDADANAS) - TUTOR (CARLOS MURILLO)',
    recordedAt: '2026-06-08',
    geminiDocId: '1lrEVV06TnYNcsM4s9BtTLoAPMmpTDAK9Zep_ZZkMnyM',
  },
  '107smw6JunhXHRXhK-K0DzV8nscfIPS4A': {
    title:
      'PREICFES VACACIONAL - CLASE #2 - RANGO DE PREGUNTAS (1 A 24) - AREA (MATEMÁTICAS) - TUTOR (ANGEL PACHECO)',
    recordedAt: '2026-06-09',
    geminiDocId: '1C_rcAG7EXUdLoe4fWvSIOe4qL-1vBLv4ebpnf1X6qx8',
  },
  '14J0uV7jRYwnKmuBfv2zLt3Scr4PkzLDQ': {
    title:
      'PREICFES VACACIONAL - CLASE #3 - RANGO DE PREGUNTAS (1 A 75) - AREA (INGLÉS) - TUTOR (GABRIEL SUTACHÁN)',
    recordedAt: '2026-06-10',
    geminiDocId: '1xkQR5CDjvHUlHKaLQA-LYY0W2h7lLMHsMLXu1UxdSYs',
  },
  '1tLQUQCNDPkhGIsp--iLrgHY4EDyqb-yu': {
    title:
      'PREICFES VACACIONAL - CLASE #4 - RANGO DE PREGUNTAS (25 A 48) - AREA (COMPETENCIAS CIUDADANAS) - TUTOR (DAVID CARDONA)',
    recordedAt: '2026-06-10',
    geminiDocId: '1P2gPLd_U2x8bO3Ohxw1iW-c4o6SAa-unSkP9xlvGpGg',
  },
  '1l8iyVnv4D1B8xNDjCH8ti3LTNFQNzjZB': {
    title:
      'PREICFES VACACIONAL - CLASE #5 - RANGO DE PREGUNTAS (76 A 141) - AREA (INGLÉS) - TUTOR (GABRIEL SUTACHAN)',
    recordedAt: '2026-06-11',
    geminiDocId: '1QjNwj9As9AFE-O75hFKv0lnrhdDUXyOwDMRbBwV0q-8',
  },
  '11ky4XsL3wr620TvQsvLQzG_owSqeCbHJ': {
    title:
      'PREICFES VACACIONAL - CLASE #6 - RANGO DE PREGUNTAS (49 A 72) - AREA (COMPETENCIAS CIUDADANAS) - TUTOR (CARLOS MURILLO)',
    recordedAt: '2026-06-11',
    geminiDocId: '1CzM-3P3jrWZfGhYemcrNOF7Ku7N1O301AGUJB3foXsg',
  },
};

export function vacacionalRecordingCanon(driveFileId?: string | null): VacacionalRecordingCanon | null {
  if (!driveFileId) return null;
  return VACACIONAL_RECORDING_CANON_BY_DRIVE[driveFileId] ?? null;
}

export function geminiDocUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/edit`;
}
