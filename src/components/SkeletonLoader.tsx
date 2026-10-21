'use client';

import React from 'react';
import SgBrandedLoadingExperience from '@/components/SgBrandedLoadingExperience';

/* ═══════════════════════════════════════════════════════════════
 *  SKELETON LOADER — Shimmer effect CSS puro
 *
 *  Variantes:
 *  - dashboard: Header + KPI cards + cards de materias + chart
 *  - estadisticas: Header + KPI cards + radar placeholder + cards
 *  - analisis: Header + tabs + heatmap grid + insights
 *  - ranking: Header + KPI cards + tabla
 *  - perfil: Avatar + campos de formulario
 * ═══════════════════════════════════════════════════════════════ */

const SHIMMER_CSS = `
.sk-shimmer {
    background: linear-gradient(110deg, rgba(255,255,255,0.04) 8%, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0.04) 33%);
    border-radius: 8px;
    background-size: 200% 100%;
    animation: sk-shine 1.5s linear infinite;
}
.sk-circle { border-radius: 50%; }
.sk-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
    transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes sk-shine {
    to { background-position-x: -200%; }
}
@media (prefers-reduced-motion: reduce) {
    .sk-shimmer {
        animation: none !important;
        background-position-x: 0 !important;
    }
    .sk-card {
        transition: none !important;
    }
}
`;

function ShimmerBar({ w = '100%', h = 12, mb = 0, round = false }: { w?: string | number; h?: number; mb?: number; round?: boolean }) {
    return (
        <div
            className={`sk-shimmer ${round ? 'sk-circle' : ''}`}
            style={{ width: typeof w === 'number' ? `${w}px` : w, height: h, marginBottom: mb, flexShrink: 0 }}
        />
    );
}

function SkeletonBrandedHeader({ message }: { message?: string }) {
    return (
        <div className="mx-auto mb-6 max-w-7xl">
            <SgBrandedLoadingExperience
                variant="embedded"
                message={message}
                showPercent={false}
                className="py-4"
            />
        </div>
    );
}

export function DashboardSkeleton({ message }: { message?: string } = {}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6">
            <style>{SHIMMER_CSS}</style>
            <SkeletonBrandedHeader message={message} />
            <div className="max-w-7xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShimmerBar w={48} h={48} round />
                        <div className="space-y-2">
                            <ShimmerBar w={180} h={20} />
                            <ShimmerBar w={120} h={12} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <ShimmerBar w={44} h={44} />
                        <ShimmerBar w={44} h={44} />
                    </div>
                </div>

                {/* Simulacro selector */}
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <ShimmerBar key={i} w={100} h={36} />
                    ))}
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="sk-card space-y-3">
                            <ShimmerBar w="50%" h={10} />
                            <ShimmerBar w="40%" h={32} />
                            <ShimmerBar w="70%" h={10} />
                        </div>
                    ))}
                </div>

                {/* Subject cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="sk-card flex items-center gap-3">
                            <ShimmerBar w={48} h={48} />
                            <div className="flex-1 space-y-2">
                                <ShimmerBar w="60%" h={14} />
                                <ShimmerBar w="40%" h={10} />
                                <ShimmerBar w="80%" h={6} />
                            </div>
                            <ShimmerBar w={40} h={24} />
                        </div>
                    ))}
                </div>

                {/* Chart area */}
                <div className="sk-card space-y-3" style={{ minHeight: 200 }}>
                    <ShimmerBar w="40%" h={16} />
                    <div className="flex items-end gap-2 mt-6" style={{ height: 140 }}>
                        {[40, 70, 55, 85, 45, 65, 50].map((h, i) => (
                            <div key={i} className="sk-shimmer flex-1" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EstadisticasSkeleton({ message }: { message?: string } = {}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6">
            <style>{SHIMMER_CSS}</style>
            <SkeletonBrandedHeader message={message} />
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShimmerBar w={40} h={40} />
                        <div className="space-y-2">
                            <ShimmerBar w={200} h={18} />
                            <ShimmerBar w={80} h={10} />
                        </div>
                    </div>
                    <ShimmerBar w={80} h={36} />
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="sk-card space-y-3">
                            <ShimmerBar w="55%" h={10} />
                            <ShimmerBar w="45%" h={32} />
                            <ShimmerBar w="65%" h={10} />
                        </div>
                    ))}
                </div>

                {/* Radar chart placeholder */}
                <div className="sk-card flex items-center justify-center" style={{ minHeight: 260 }}>
                    <div className="sk-shimmer sk-circle" style={{ width: 200, height: 200, opacity: 0.5 }} />
                </div>

                {/* Subject ranking cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="sk-card flex items-center gap-3">
                            <ShimmerBar w={40} h={40} />
                            <div className="flex-1 space-y-2">
                                <ShimmerBar w="50%" h={14} />
                                <ShimmerBar w="35%" h={10} />
                            </div>
                            <ShimmerBar w={48} h={28} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function AnalisisSkeleton({ message }: { message?: string } = {}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6">
            <style>{SHIMMER_CSS}</style>
            <SkeletonBrandedHeader message={message} />
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header bar */}
                <div className="flex items-center justify-between p-3 sk-card">
                    <div className="flex items-center gap-3">
                        <ShimmerBar w={40} h={40} />
                        <div className="space-y-1.5">
                            <ShimmerBar w={160} h={14} />
                            <ShimmerBar w={90} h={10} />
                        </div>
                    </div>
                    <ShimmerBar w={36} h={36} />
                </div>

                {/* Subject tabs */}
                <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map(i => (
                        <ShimmerBar key={i} w={80} h={40} />
                    ))}
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="sk-card space-y-3">
                            <ShimmerBar w="55%" h={10} />
                            <ShimmerBar w="40%" h={28} />
                            <ShimmerBar w="60%" h={10} />
                        </div>
                    ))}
                </div>

                {/* Heatmap grid */}
                <div className="sk-card space-y-3">
                    <ShimmerBar w="40%" h={16} />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {Array.from({ length: 35 }, (_, i) => (
                            <div key={i} className="sk-shimmer" style={{ width: 40, height: 40, borderRadius: 8 }} />
                        ))}
                    </div>
                </div>

                {/* Insights */}
                <div className="sk-card space-y-3">
                    <ShimmerBar w="35%" h={14} />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <ShimmerBar w={42} h={42} />
                            <div className="flex-1 space-y-1.5">
                                <ShimmerBar w="60%" h={12} />
                                <ShimmerBar w="80%" h={8} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function RankingSkeleton({ message }: { message?: string } = {}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6">
            <style>{SHIMMER_CSS}</style>
            <SkeletonBrandedHeader message={message} />
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 sk-card">
                    <ShimmerBar w={56} h={56} />
                    <div className="flex-1 space-y-2">
                        <ShimmerBar w="60%" h={20} />
                        <ShimmerBar w="35%" h={14} />
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="sk-card space-y-3">
                            <ShimmerBar w="60%" h={10} />
                            <ShimmerBar w="50%" h={28} />
                            <ShimmerBar w="80%" h={10} />
                        </div>
                    ))}
                </div>

                {/* Table rows */}
                <div className="sk-card" style={{ padding: 0 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <ShimmerBar w={32} h={32} round />
                            <ShimmerBar w={32} h={32} round />
                            <div className="flex-1 space-y-1.5">
                                <ShimmerBar w={`${50 + (i * 5) % 40}%`} h={12} />
                                <ShimmerBar w={`${30 + (i * 7) % 30}%`} h={8} />
                            </div>
                            <ShimmerBar w={50} h={20} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function PerfilSkeleton({ message }: { message?: string } = {}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
            <style>{SHIMMER_CSS}</style>
            <SkeletonBrandedHeader message={message} />
            <div className="mx-auto w-full max-w-md space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                    <ShimmerBar w={96} h={96} round />
                    <ShimmerBar w={140} h={18} />
                    <ShimmerBar w={100} h={12} />
                </div>

                {/* Read-only fields */}
                <div className="sk-card space-y-4">
                    <ShimmerBar w="30%" h={10} />
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-1.5">
                            <ShimmerBar w={100} h={10} />
                            <ShimmerBar w="100%" h={40} />
                        </div>
                    ))}
                </div>

                {/* Editable fields */}
                <div className="sk-card space-y-4">
                    <ShimmerBar w="40%" h={10} />
                    <div className="space-y-1.5">
                        <ShimmerBar w={80} h={10} />
                        <ShimmerBar w="100%" h={72} />
                    </div>
                </div>

                {/* Social links */}
                <div className="sk-card space-y-3">
                    <ShimmerBar w="45%" h={10} />
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <ShimmerBar w={36} h={36} />
                            <ShimmerBar w="70%" h={36} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
