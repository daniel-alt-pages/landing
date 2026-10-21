export interface RespuestaDetallada {
    numero: number;
    respuesta_estudiante: string;
    respuesta?: string;
    respuesta_correcta: string;
    es_correcta: boolean;
    sin_respuesta?: boolean;
    /** Sesión no presentada — N/A explícito del pipeline. */
    sesion_no_presentada?: boolean;
    invalidada?: boolean;
    sesion?: string;
    tema_raw?: string;
    temas?: string[];
    tema_principal?: string;
    area?: string;
    competencia?: string;
    componente?: string;
    afirmacion?: string;
    evidencia?: string;
    nivel_cognitivo?: string;
    tipo_texto_o_evidencia?: string;
    fuente_marco?: string;
}

export type IntensidadPlan = 'ligero' | 'normal' | 'intensivo';

export type RecomendacionDetallada = {
    objetivo: string;
    queEstudiar: string[];
    comoEstudiar: string[];
    recursos: string[];
    evaluacion: string;
    contextoRepaso: string;
};
