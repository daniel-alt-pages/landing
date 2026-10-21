'use client';

import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    ArrowLeftRight,
    Award,
    Ban,
    BarChart3,
    BookOpen,
    Building2,
    Calculator,
    Check,
    CheckCircle2,
    Clock,
    FileText,
    FlaskConical,
    Globe2,
    GraduationCap,
    Languages,
    Lightbulb,
    MousePointerClick,
    RefreshCw,
    Star,
    Target,
    TrendingDown,
    TrendingUp,
    Trophy,
    Users,
    Wrench,
    X,
    XCircle,
    Zap,
} from 'lucide-react';

export function CoordIcon({
    icon: Icon,
    size = 16,
    className = '',
    strokeWidth = 2,
}: {
    icon: LucideIcon;
    size?: number;
    className?: string;
    strokeWidth?: number;
}) {
    return <Icon size={size} strokeWidth={strokeWidth} className={`shrink-0 ${className}`.trim()} aria-hidden />;
}

export const CoordIcons = {
    AlertTriangle,
    ArrowLeftRight,
    Award,
    Ban,
    BarChart3,
    BookOpen,
    Building2,
    Calculator,
    Check,
    CheckCircle2,
    Clock,
    FileText,
    FlaskConical,
    Globe2,
    GraduationCap,
    Languages,
    Lightbulb,
    MousePointerClick,
    RefreshCw,
    Star,
    Target,
    TrendingDown,
    TrendingUp,
    Trophy,
    Users,
    Wrench,
    X,
    XCircle,
    Zap,
};

export type SeverityTone = 'success' | 'danger' | 'warning' | 'info' | 'orange';

const SEVERITY_DOT: Record<SeverityTone, string> = {
    success: 'bg-emerald-400',
    danger: 'bg-red-400',
    warning: 'bg-amber-400',
    info: 'bg-blue-400',
    orange: 'bg-orange-400',
};

export function SeverityDot({ tone, className = '' }: { tone: SeverityTone; className?: string }) {
    return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[tone]} ${className}`.trim()} aria-hidden />;
}

export function MateriaIcon({
    materia,
    size = 14,
    className = '',
}: {
    materia: string;
    size?: number;
    className?: string;
}) {
    const key = materia.toLowerCase();
    if (key.includes('mat')) return <CoordIcon icon={Calculator} size={size} className={className} />;
    if (key.includes('lectura') || key.includes('lec')) return <CoordIcon icon={BookOpen} size={size} className={className} />;
    if (key.includes('social') || key.includes('soc')) return <CoordIcon icon={Globe2} size={size} className={className} />;
    if (key.includes('cien') || key.includes('natural')) return <CoordIcon icon={FlaskConical} size={size} className={className} />;
    return <CoordIcon icon={Languages} size={size} className={className} />;
}

export function StatusPill({
    ok,
    label,
    className = '',
}: {
    ok: boolean;
    label: string;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${
                ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            } ${className}`.trim()}
        >
            <CoordIcon icon={ok ? Check : XCircle} size={12} />
            {label}
        </span>
    );
}

export function LevelCountBadge({
    label,
    count,
    tone,
}: {
    label: string;
    count: number;
    tone: 'superior' | 'alto' | 'medio' | 'bajo';
}) {
    const styles: Record<typeof tone, string> = {
        superior: 'bg-emerald-500/20 text-emerald-300',
        alto: 'bg-blue-500/20 text-blue-300',
        medio: 'bg-amber-500/20 text-amber-300',
        bajo: 'bg-red-500/20 text-red-300',
    };
    return (
        <span className={`rounded px-2 py-0.5 text-xs font-semibold tabular-nums ${styles[tone]}`}>
            {label} {count}
        </span>
    );
}

export function MineMarker({ className = '' }: { className?: string }) {
    return (
        <span
            className={`inline-flex items-center gap-0.5 rounded bg-purple-500/15 px-1 py-px text-[10px] font-bold uppercase tracking-wide text-purple-300 ${className}`.trim()}
            title="Tu institución"
        >
            <CoordIcon icon={Star} size={10} className="text-purple-300" />
            Tú
        </span>
    );
}
