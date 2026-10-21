'use client';
import { BookOpen, Calculator, FlaskConical, Globe, Languages } from 'lucide-react';
import type { SubjectStat } from '@features/coordinador/hooks/useCoordinadorData';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { sgAreaHexBySubjectName } from '@shared/lib/sgAreaColors';

const SUBJECT_UI: Record<
    string,
    { icon: typeof BookOpen; color: string; short: string }
> = {
    'Matemáticas': { icon: Calculator, color: sgAreaHexBySubjectName('Matemáticas'), short: 'MAT' },
    'Lectura Crítica': { icon: BookOpen, color: sgAreaHexBySubjectName('Lectura Crítica'), short: 'LEC' },
    Sociales: { icon: Globe, color: sgAreaHexBySubjectName('Sociales'), short: 'SOC' },
    'Sociales y Ciudadanas': { icon: Globe, color: sgAreaHexBySubjectName('Sociales y Ciudadanas'), short: 'SOC' },
    Ciencias: { icon: FlaskConical, color: sgAreaHexBySubjectName('Ciencias'), short: 'CIEN' },
    'Ciencias Naturales': { icon: FlaskConical, color: sgAreaHexBySubjectName('Ciencias Naturales'), short: 'CIEN' },
    Inglés: { icon: Languages, color: sgAreaHexBySubjectName('Inglés'), short: 'ING' },
};

function subjectMeta(name: string) {
    return (
        SUBJECT_UI[name] ?? {
            icon: BookOpen,
            color: '#818cf8',
            short: name.substring(0, 4).toUpperCase(),
        }
    );
}

/** Franja de áreas — layout Stitch «Desempeño por Área». */
export default function CoordinadorSubjectStrip({ subjects }: { subjects: SubjectStat[] }) {
    if (!subjects.length) return null;

    return (
        <section
            data-coord-tour={TourAnchors.dashboardSubjectStrip}
            className="coord-stagger-in"
            aria-labelledby="coord-subject-strip-title"
        >
            <h2 id="coord-subject-strip-title" className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" aria-hidden />
                Desempeño por área
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {subjects.map(s => {
                    const meta = subjectMeta(s.name);
                    const Icon = meta.icon;
                    const pctBar = Math.min(100, Math.max(0, (s.avg / 100) * 100));
                    return (
                        <div
                            key={s.key || s.name}
                            className="coord-glass-card coord-subject-card rounded-lg p-4 border border-white/[0.08] bg-[#111827]/80"
                        >
                            <div className="flex items-center gap-2 mb-3 min-w-0">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                                    style={{
                                        background: `${meta.color}20`,
                                        borderColor: `${meta.color}40`,
                                    }}
                                >
                                    <Icon className="w-4 h-4" style={{ color: meta.color }} aria-hidden />
                                </div>
                                <h3 className="text-sm font-bold text-white truncate" title={s.name}>
                                    {s.name}
                                </h3>
                            </div>
                            <div className="flex items-end justify-between mb-2 gap-2">
                                <span className="text-2xl font-black text-white tabular-nums">{Math.round(s.avg)}</span>
                                <span className="text-xs text-white/50 mb-1">pts prom.</span>
                            </div>
                            <div className="w-full bg-white/[0.06] rounded-full h-1">
                                <div
                                    className="h-1 rounded-full transition-all duration-500"
                                    style={{ width: `${pctBar}%`, background: meta.color }}
                                />
                            </div>
                            <p className="text-[10px] text-white/45 mt-2 tabular-nums">
                                {s.countStudents} estudiantes · med. {Math.round(s.median)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
