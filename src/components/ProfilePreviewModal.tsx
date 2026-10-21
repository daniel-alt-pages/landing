'use client';

import React, { useState, useEffect } from 'react';
import { getStudentProfile, StudentProfileData, StudentSocials } from '@/lib/profileService';

/* ═══════════════════════════════════════════════════════════════
 *  PROFILE PREVIEW MODAL
 *
 *  Se abre al hacer clic en un estudiante del ranking.
 *  Muestra: foto, nombre, bio, redes sociales, puntaje.
 *  Con skeleton loader shimmer mientras carga.
 * ═══════════════════════════════════════════════════════════════ */

interface ProfilePreviewProps {
    studentId: string;
    studentName: string;
    studentScore?: number;
    studentInstitution?: string;
    studentPosition?: number;
    /** Ubicación / perfil (modal móvil o detalle). */
    studentMunicipio?: string;
    studentDepartamento?: string;
    studentColegio?: string;
    studentGrado?: string;
    onClose: () => void;
}

const SOCIAL_META: Record<string, { label: string; color: string; prefix: string; icon: React.ReactNode }> = {
    instagram: {
        label: 'Instagram', color: '#E1306C', prefix: 'https://instagram.com/',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
    },
    tiktok: {
        label: 'TikTok', color: '#00f2ea', prefix: 'https://tiktok.com/@',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.56a8.28 8.28 0 0 0 4.84 1.55V6.69h-1.08z" /></svg>,
    },
    twitter: {
        label: 'X', color: '#1DA1F2', prefix: 'https://x.com/',
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
    },
    whatsapp: {
        label: 'WhatsApp', color: '#25D366', prefix: 'https://wa.me/57',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
    },
    linkedin: {
        label: 'LinkedIn', color: '#0A66C2', prefix: 'https://linkedin.com/in/',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
    },
    youtube: {
        label: 'YouTube', color: '#FF0000', prefix: 'https://youtube.com/@',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
    },
};

const CSS = `
    .ppv-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; animation: ppv-fade-in 0.2s ease; }
    .ppv-card { background: linear-gradient(160deg, #1a1a3e 0%, #0f172a 50%, #1a1145 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); width: 100%; max-width: 380px; max-height: 85vh; overflow-y: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.5); animation: ppv-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .ppv-close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .ppv-close:hover { background: rgba(255,255,255,0.15); color: #fff; }

    /* Skeleton Shimmer */
    .ppv-skeleton { background: linear-gradient(110deg, rgba(255,255,255,0.05) 8%, rgba(255,255,255,0.1) 18%, rgba(255,255,255,0.05) 33%); border-radius: 8px; background-size: 200% 100%; animation: ppv-shine 1.5s linear infinite; }
    .ppv-skeleton-circle { border-radius: 50%; }
    @keyframes ppv-shine { to { background-position-x: -200%; } }
    @keyframes ppv-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ppv-slide-up { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

    /* Social link */
    .ppv-social { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); text-decoration: none; transition: all 0.2s; }
    .ppv-social:hover { background: rgba(255,255,255,0.08); transform: translateX(4px); }
`;

export default function ProfilePreviewModal({
    studentId,
    studentName,
    studentScore,
    studentInstitution,
    studentPosition,
    studentMunicipio,
    studentDepartamento,
    studentColegio,
    studentGrado,
    onClose,
}: ProfilePreviewProps) {
    const [profile, setProfile] = useState<StudentProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getStudentProfile(studentId);
                setProfile(data);
            } catch { /* ignore */ }
            setLoading(false);
        };
        load();
    }, [studentId]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const initials = studentName
        .split(' ')
        .map(w => w.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const activeSocials = profile?.socials
        ? Object.entries(profile.socials).filter(([, v]) => v && v.trim())
        : [];

    const hasProfileData = profile && (profile.photoUrl || profile.bio || activeSocials.length > 0);

    return (
        <>
            <style>{CSS}</style>
            <div className="ppv-overlay" onClick={onClose}>
                <div className="ppv-card" onClick={e => e.stopPropagation()}>
                    {/* Close */}
                    <div style={{ position: 'relative' }}>
                        <button className="ppv-close" onClick={onClose} aria-label="Cerrar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>

                    {/* Hero */}
                    <div style={{ padding: '28px 20px 16px', textAlign: 'center' }}>
                        {loading ? (
                            <>
                                <div className="ppv-skeleton ppv-skeleton-circle" style={{ width: 80, height: 80, margin: '0 auto 12px' }} />
                                <div className="ppv-skeleton" style={{ width: 140, height: 18, margin: '0 auto 8px' }} />
                                <div className="ppv-skeleton" style={{ width: 100, height: 12, margin: '0 auto' }} />
                            </>
                        ) : (
                            <>
                                {/* Avatar */}
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
                                    background: profile?.photoUrl
                                        ? `url(${profile.photoUrl}) center/cover no-repeat`
                                        : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    border: '3px solid rgba(99,102,241,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
                                }}>
                                    {!profile?.photoUrl && (
                                        <span style={{ fontSize: 28, color: '#fff', fontWeight: 700 }}>{initials}</span>
                                    )}
                                </div>

                                {/* Name + Position */}
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>
                                    {studentName}
                                </h3>
                                {studentInstitution && (
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                                        {studentInstitution}
                                    </p>
                                )}

                                {(studentMunicipio || studentDepartamento || studentColegio || studentGrado) ? (
                                    <div style={{ marginTop: 10, textAlign: 'left', padding: '0 4px' }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                            Ubicación y colegio
                                        </p>
                                        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                                            {[
                                                ['Municipio', studentMunicipio],
                                                ['Departamento', studentDepartamento],
                                                ['Colegio', studentColegio || studentInstitution],
                                                ['Grado', studentGrado],
                                            ]
                                                .filter(([, v]) => v && String(v).trim())
                                                .map(([label, value]) => (
                                                    <div key={label}>
                                                        <dt style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{label}</dt>
                                                        <dd style={{ margin: '2px 0 0', color: '#e2e8f0', fontWeight: 600 }}>{value}</dd>
                                                    </div>
                                                ))}
                                        </dl>
                                    </div>
                                ) : null}

                                {/* Score + Position badges */}
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                                    {studentPosition && (
                                        <span style={{
                                            padding: '4px 12px', borderRadius: 20,
                                            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)',
                                            fontSize: 12, fontWeight: 700, color: '#fbbf24',
                                        }}>
                                            #{studentPosition}
                                        </span>
                                    )}
                                    {studentScore !== undefined && (
                                        <span style={{
                                            padding: '4px 12px', borderRadius: 20,
                                            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
                                            fontSize: 12, fontWeight: 700, color: '#a5b4fc',
                                        }}>
                                            {studentScore} pts
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Bio */}
                    {loading ? (
                        <div style={{ padding: '0 20px 16px' }}>
                            <div className="ppv-skeleton" style={{ width: '100%', height: 12, marginBottom: 6 }} />
                            <div className="ppv-skeleton" style={{ width: '70%', height: 12 }} />
                        </div>
                    ) : profile?.bio ? (
                        <div style={{ padding: '0 20px 16px' }}>
                            <div style={{
                                padding: '12px 14px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, fontStyle: 'italic',
                            }}>
                                &ldquo;{profile.bio}&rdquo;
                            </div>
                        </div>
                    ) : null}

                    {/* Social Links */}
                    {loading ? (
                        <div style={{ padding: '0 20px 20px', display: 'grid', gap: 8 }}>
                            {[1, 2].map(i => (
                                <div key={i} className="ppv-skeleton" style={{ width: '100%', height: 40 }} />
                            ))}
                        </div>
                    ) : activeSocials.length > 0 ? (
                        <div style={{ padding: '0 20px 20px', display: 'grid', gap: 6 }}>
                            <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                                Redes sociales
                            </span>
                            {activeSocials.map(([key, value]) => {
                                const meta = SOCIAL_META[key];
                                if (!meta) return null;
                                const href = value!.startsWith('http') ? value! : `${meta.prefix}${value!.replace('@', '')}`;
                                return (
                                    <a
                                        key={key}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ppv-social"
                                    >
                                        <span style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: `${meta.color}18`, color: meta.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {meta.icon}
                                        </span>
                                        <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                                            {value}
                                        </span>
                                    </a>
                                );
                            })}
                        </div>
                    ) : null}

                    {/* No profile message */}
                    {!loading && !hasProfileData && (
                        <div style={{ padding: '0 20px 24px', textAlign: 'center' }}>
                            <p style={{ fontSize: 13, color: '#475569' }}>
                                Este estudiante aún no ha personalizado su perfil.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
