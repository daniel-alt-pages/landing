export type LandingImpactSubjectKey =
  | 'matemáticas'
  | 'lectura crítica'
  | 'sociales y ciudadanas'
  | 'ciencias naturales'
  | 'inglés';

export type LandingImpactSubjectAverages = Partial<Record<LandingImpactSubjectKey, number>>;

export type LandingImpactDepartmentRow = {
  department: string;
  uniqueUsers: number;
  evaluations: number;
  validEvaluations: number;
  averageScore: number | null;
  successRate: number;
  subjectAverages?: LandingImpactSubjectAverages;
};

export type LandingImpactSummary = {
  generatedAt: string;
  source: string;
  privacy?: string;
  simulations: string[];
  totals: {
    simulations: number;
    uniqueUsers: number;
    evaluations: number;
    validEvaluations: number;
    departments: number;
    averageScore: number;
  };
  departments: LandingImpactDepartmentRow[];
};
