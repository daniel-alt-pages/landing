'use client';

import type { ReactNode } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import type { LandingTone } from '../tipos';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
);

const SAMPLE_CYCLES = ['Sim. 1', 'Sim. 2', 'Sim. 3', 'Sim. 4'];
const SAMPLE_SCORES = [286, 312, 338, 361];
const SAMPLE_AREAS = ['Lectura', 'Matemáticas', 'Sociales', 'Naturales', 'Inglés'];
const SAMPLE_AREA_SCORES = [74, 68, 71, 63, 79];
const SAMPLE_COURSES = ['9°A', '9°B', '10°A', '11°A'];
const SAMPLE_AT_RISK = [8, 5, 11, 6];

function chartColors(tone: LandingTone) {
  const isLight = tone === 'light';
  return {
    grid: isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    tick: isLight ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.45)',
    line: isLight ? 'rgb(8, 145, 178)' : 'rgb(103, 232, 249)',
    lineFill: isLight ? 'rgba(8, 145, 178, 0.12)' : 'rgba(103, 232, 249, 0.14)',
    bar: isLight ? 'rgba(14, 116, 144, 0.85)' : 'rgba(34, 211, 238, 0.82)',
    barMuted: isLight ? 'rgba(100, 116, 139, 0.55)' : 'rgba(148, 163, 184, 0.5)',
    doughnut: [
      isLight ? 'rgba(8, 145, 178, 0.9)' : 'rgba(103, 232, 249, 0.9)',
      isLight ? 'rgba(148, 163, 184, 0.35)' : 'rgba(255, 255, 255, 0.12)',
    ],
  };
}

function baseOptions(tone: LandingTone, title: string) {
  const c = chartColors(tone);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tone === 'light' ? '#0f172a' : '#07111f',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
      },
      title: {
        display: true,
        text: title,
        color: tone === 'light' ? '#0f172a' : '#f8fafc',
        font: { size: 12, weight: 'bold' as const },
        padding: { bottom: 8 },
      },
    },
    scales: {
      x: {
        grid: { color: c.grid },
        ticks: { color: c.tick, font: { size: 10 } },
        border: { display: false },
      },
      y: {
        grid: { color: c.grid },
        ticks: { color: c.tick, font: { size: 10 } },
        border: { display: false },
      },
    },
  };
}

type ChartCardProps = {
  tone: LandingTone;
  label: string;
  caption: string;
  children: ReactNode;
};

function ChartCard({ tone, label, caption, children }: ChartCardProps) {
  const isLight = tone === 'light';
  return (
    <article
      className={`flex min-h-[15.5rem] flex-col overflow-hidden rounded-[1.35rem] border p-4 sm:min-h-[17rem] sm:p-5 ${
        isLight
          ? 'border-slate-200/90 bg-white shadow-md shadow-slate-900/5'
          : 'border-white/[0.08] bg-white/[0.03] shadow-xl shadow-black/25'
      }`}
    >
      <p
        className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${
          isLight ? 'text-cyan-700' : 'text-cyan-300/90'
        }`}
      >
        {label}
      </p>
      <div className="relative mt-3 min-h-[11rem] flex-1">{children}</div>
      <p className={`mt-3 text-[11px] leading-relaxed sm:text-xs ${isLight ? 'text-slate-600' : 'text-white/50'}`}>
        {caption}
      </p>
      <p className={`mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] ${isLight ? 'text-slate-400' : 'text-white/28'}`}>
        Datos de muestra · panel coordinador
      </p>
    </article>
  );
}

export const COORDINATOR_ACCESS_ITEMS = [
  {
    title: 'Resumen institucional',
    text: 'Promedio global, participación, distribución por área y evolución entre simulacros del colegio.',
  },
  {
    title: 'Cursos y grados',
    text: 'Comparativa por grupo (9°, 10°, 11°), ranking interno y estudiantes en alerta académica.',
  },
  {
    title: 'Estudiantes en detalle',
    text: 'Ficha por alumno: puntaje, histórico, áreas críticas y recomendaciones de refuerzo.',
  },
  {
    title: 'Exportación y seguimiento',
    text: 'Reportes para consejo directivo, actas de retroalimentación y trazabilidad por ciclo.',
  },
] as const;

export function CoordinatorMethodCharts({ tone }: { tone: LandingTone }) {
  const c = chartColors(tone);
  const isLight = tone === 'light';

  const evolutionData = {
    labels: SAMPLE_CYCLES,
    datasets: [
      {
        data: SAMPLE_SCORES,
        borderColor: c.line,
        backgroundColor: c.lineFill,
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: c.line,
        borderWidth: 2.5,
      },
    ],
  };

  const areasData = {
    labels: SAMPLE_AREAS,
    datasets: [
      {
        data: SAMPLE_AREA_SCORES,
        backgroundColor: SAMPLE_AREA_SCORES.map((v, i) => (i === 3 ? c.barMuted : c.bar)),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const riskData = {
    labels: SAMPLE_COURSES,
    datasets: [
      {
        data: SAMPLE_AT_RISK,
        backgroundColor: c.bar,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const participationData = {
    labels: ['Presentaron', 'Pendientes'],
    datasets: [
      {
        data: [92, 8],
        backgroundColor: c.doughnut,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: c.tick,
          boxWidth: 10,
          font: { size: 10 },
        },
      },
      tooltip: {
        backgroundColor: isLight ? '#0f172a' : '#07111f',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
      },
    },
  };

  return (
    <div className="mt-8 space-y-6">
      <div
        className={`rounded-[1.35rem] border p-4 sm:p-5 ${
          isLight
            ? 'border-cyan-200/80 bg-cyan-50/50'
            : 'border-cyan-400/20 bg-cyan-400/[0.06]'
        }`}
      >
        <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isLight ? 'text-cyan-800' : 'text-cyan-200/85'}`}>
          Qué ve el coordinador
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {COORDINATOR_ACCESS_ITEMS.map((item) => (
            <li
              key={item.title}
              className={`rounded-xl border p-3 ${
                isLight ? 'border-slate-200/90 bg-white/90' : 'border-white/[0.08] bg-white/[0.03]'
              }`}
            >
              <p className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</p>
              <p className={`mt-1.5 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-white/55'}`}>
                {item.text}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ChartCard
          tone={tone}
          label="Evolución"
          caption="Promedio institucional por ciclo de simulacro (escala ilustrativa 0–500)."
        >
          <Line data={evolutionData} options={baseOptions(tone, 'Promedio por simulacro')} />
        </ChartCard>

        <ChartCard
          tone={tone}
          label="Áreas ICFES"
          caption="Porcentaje de acierto relativo por área para priorizar refuerzos con el equipo."
        >
          <Bar
            data={areasData}
            options={{
              ...baseOptions(tone, 'Desempeño por área'),
              indexAxis: 'y' as const,
            }}
          />
        </ChartCard>

        <ChartCard
          tone={tone}
          label="Participación"
          caption="Estudiantes que completaron el simulacro vs. matrícula esperada en el ciclo."
        >
          <Doughnut data={participationData} options={doughnutOptions} />
        </ChartCard>

        <ChartCard
          tone={tone}
          label="Alertas por curso"
          caption="Conteo de estudiantes bajo umbral de desempeño por grupo (dato de muestra)."
        >
          <Bar data={riskData} options={baseOptions(tone, 'Estudiantes en alerta')} />
        </ChartCard>
      </div>
    </div>
  );
}
