'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { uploadBlobToImgBB, deleteFromImgBB } from '@/lib/imgbb';
import { STUDENT_ERRORS } from '@/lib/studentUserFacingErrors';
import { getStudentProfile, saveStudentProfile, StudentSocials } from '@/lib/profileService';
import { ensureEstudianteSessionBootstrap } from '@features/estudiante/hooks/ensureEstudianteSessionBootstrap';
import { displayDocumentId, displayStudentName } from '@/app/demo/_shared/demoPrivacy';
import PhotoCropModal from '@/components/PhotoCropModal';
import CourseProfileShortcut from '@features/curso/components/CourseProfileShortcut';
import { PerfilSkeleton } from '@/components/SkeletonLoader';

/* ═══════════════════════════════════════════════════════════════
 *  PERFIL DEL ESTUDIANTE — v2 Premium
 * ═══════════════════════════════════════════════════════════════ */

const SOCIAL_CONFIG = [
    {
        key: 'instagram', label: 'Instagram', placeholder: '@tu_usuario',
        color: '#E1306C',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
    },
    {
        key: 'tiktok', label: 'TikTok', placeholder: '@tu_usuario',
        color: '#00f2ea',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.56a8.28 8.28 0 0 0 4.84 1.55V6.69h-1.08z" /></svg>
    },
    {
        key: 'twitter', label: 'X (Twitter)', placeholder: '@tu_usuario',
        color: '#1DA1F2',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    },
    {
        key: 'whatsapp', label: 'WhatsApp', placeholder: '3001234567',
        color: '#25D366',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
    },
    {
        key: 'linkedin', label: 'LinkedIn', placeholder: 'tu-nombre',
        color: '#0A66C2',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
    },
    {
        key: 'youtube', label: 'YouTube', placeholder: '@tu_canal',
        color: '#FF0000',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
    },
];

const CSS = `
    .prf-page { min-height: 100vh; background: linear-gradient(160deg, #0c1222 0%, #1a1145 40%, #0f172a 100%); color: #e2e8f0; font-family: 'Inter', -apple-system, sans-serif; }
    
    /* Header */
    .prf-header { padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .prf-back { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #94a3b8; padding: 8px; cursor: pointer; display: flex; }
    .prf-back:active { transform: scale(0.95); }
    .prf-title { font-size: 17px; font-weight: 700; color: #fff; }

    /* Hero */
    .prf-hero { padding: 28px 20px 24px; text-align: center; position: relative; }
    .prf-hero::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 200px; height: 200px; background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%); pointer-events: none; }
    
    .prf-avatar-wrap { position: relative; display: inline-block; margin-bottom: 16px; }
    .prf-avatar { width: 96px; height: 96px; border-radius: 50%; border: 3px solid rgba(99,102,241,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; background: linear-gradient(135deg, #4f46e5, #7c3aed); box-shadow: 0 8px 32px rgba(99,102,241,0.25); transition: transform 0.2s, box-shadow 0.2s; background-size: cover; background-position: center; }
    .prf-avatar:hover { transform: scale(1.05); box-shadow: 0 8px 40px rgba(99,102,241,0.35); }
    .prf-avatar-initial { font-size: 34px; color: #fff; font-weight: 700; }
    .prf-avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.55); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .prf-cam-btn { position: absolute; bottom: 0; right: 0; width: 30px; height: 30px; border-radius: 50%; background: #6366f1; border: 2px solid #0f172a; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(99,102,241,0.4); transition: transform 0.15s; }
    .prf-cam-btn:hover { transform: scale(1.1); }

    .prf-name { font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 2px; letter-spacing: -0.01em; }
    .prf-id-text { font-size: 13px; color: #64748b; font-family: 'SF Mono', 'Fira Code', monospace; }
    .prf-inst { font-size: 12px; color: #475569; margin-top: 4px; }

    /* Card base */
    .prf-card { margin: 0 16px 14px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); overflow: hidden; }
    .prf-card-header { padding: 14px 16px 10px; display: flex; align-items: center; justify-content: space-between; }
    .prf-card-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 6px; }
    .prf-card-body { padding: 0 16px 16px; }

    /* Verified Badge */
    .prf-verified { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 20px; font-size: 10px; font-weight: 600; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.06em; }

    /* Locked fields */
    .prf-locked-field { padding: 11px 14px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid rgba(255,255,255,0.04); color: #94a3b8; font-size: 14px; position: relative; display: flex; align-items: center; justify-content: space-between; }
    .prf-locked-field .prf-lock-icon { color: #475569; flex-shrink: 0; }
    .prf-locked-label { font-size: 10px; color: #475569; font-weight: 500; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }

    /* Editable fields */
    .prf-input { width: 100%; padding: 11px 14px; background: rgba(255,255,255,0.05); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
    .prf-input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .prf-input::placeholder { color: rgba(148,163,184,0.3); }
    .prf-textarea { resize: none; line-height: 1.5; }
    .prf-char-count { text-align: right; font-size: 10px; color: #334155; margin-top: 4px; }

    /* Social items */
    .prf-social-item { display: flex; align-items: center; gap: 10px; }
    .prf-social-icon { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 10px; flex-shrink: 0; transition: transform 0.15s; }
    .prf-social-icon:hover { transform: scale(1.08); }
    
    /* Save button */
    .prf-save { width: 100%; padding: 14px; border: none; border-radius: 14px; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease; }
    .prf-save:active { transform: scale(0.98); }
    .prf-save:disabled { opacity: 0.7; cursor: wait; }
    .prf-save--default { background: linear-gradient(135deg, #4f46e5, #6366f1); box-shadow: 0 4px 20px rgba(99,102,241,0.3); }
    .prf-save--success { background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 4px 20px rgba(16,185,129,0.3); }

    /* Error */
    .prf-error { margin: 0 16px 14px; padding: 12px 14px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.15); border-radius: 10px; color: #fca5a5; font-size: 13px; display: flex; align-items: center; gap: 8px; }

    /* Spinner */
    @keyframes prf-spin { to { transform: rotate(360deg); } }
    .prf-spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: prf-spin 0.7s linear infinite; }
    .prf-spinner--sm { width: 16px; height: 16px; }

    /* Confirm Replace Dialog */
    .prf-confirm-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: prf-fade-in 0.2s ease; }
    @keyframes prf-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .prf-confirm-dialog { background: linear-gradient(160deg, #1e1b4b, #1a1145); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 28px 24px; max-width: 340px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: prf-scale-in 0.25s ease; }
    @keyframes prf-scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .prf-confirm-icon { margin-bottom: 16px; }
    .prf-confirm-title { font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 8px; }
    .prf-confirm-text { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px; }
    .prf-confirm-actions { display: flex; gap: 10px; }
    .prf-confirm-btn { flex: 1; padding: 11px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
    .prf-confirm-btn--cancel { background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); }
    .prf-confirm-btn--cancel:hover { background: rgba(255,255,255,0.1); }
    .prf-confirm-btn--confirm { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; box-shadow: 0 4px 16px rgba(245,158,11,0.3); }
    .prf-confirm-btn--confirm:hover { box-shadow: 0 4px 24px rgba(245,158,11,0.4); }
    .prf-confirm-btn--confirm:disabled { opacity: 0.6; cursor: wait; }

    /* Cooldown banner */
    .prf-cooldown { margin: 0 16px 14px; padding: 12px 14px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.12); border-radius: 12px; display: flex; align-items: center; gap: 10px; }
    .prf-cooldown-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .prf-cooldown-text { font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .prf-cooldown-text strong { color: #a5b4fc; }

    /* Google sync button */
    .prf-google-btn { margin: 8px 0 0; padding: 8px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #94a3b8; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; width: fit-content; }
    .prf-google-btn:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
    .prf-google-btn img { width: 16px; height: 16px; border-radius: 50%; }

    /* Write budget indicator */
    .prf-budget { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #475569; margin-bottom: 6px; justify-content: center; }
    .prf-budget-dots { display: flex; gap: 3px; }
    .prf-budget-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(99,102,241,0.3); }
    .prf-budget-dot.used { background: #6366f1; }
    .prf-budget-dot.empty { background: rgba(255,255,255,0.06); }

    /* Corrección de datos banner */
    .prf-correccion { margin: 0 16px 14px; padding: 14px 14px 14px 12px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-left: 3px solid #f59e0b; border-radius: 12px; display: flex; gap: 12px; align-items: flex-start; }
    .prf-correccion-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(245,158,11,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .prf-correccion-body { flex: 1; }
    .prf-correccion-title { font-size: 12px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .prf-correccion-text { font-size: 12px; color: #94a3b8; line-height: 1.55; }
`;

export default function EstudiantePerfilView() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [institucion, setInstitucion] = useState('');
    const [departamento, setDepartamento] = useState('');

    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoDeleteUrl, setPhotoDeleteUrl] = useState<string | null>(null);
    const [bio, setBio] = useState('');
    const [socials, setSocials] = useState<StudentSocials>({});

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [correccionDatos, setCorreccionDatos] = useState(false);

    // Crop modal state
    const [cropFile, setCropFile] = useState<File | null>(null);
    const [showConfirmReplace, setShowConfirmReplace] = useState(false);
    const [pendingCropBlob, setPendingCropBlob] = useState<Blob | null>(null);

    // 📸 Photo cooldown (5 days)
    const [photoCooldownDays, setPhotoCooldownDays] = useState(0);
    const [isGooglePhoto, setIsGooglePhoto] = useState(false);

    // ✏️ Write budget
    const getWriteBudget = (): { used: number; max: number } => {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const stored = localStorage.getItem('profile_write_budget');
            if (stored) {
                const { date, count } = JSON.parse(stored);
                if (date === today) return { used: count, max: 5 };
            }
            return { used: 0, max: 5 };
        } catch { return { used: 0, max: 5 }; }
    };
    const [writeBudget, setWriteBudget] = useState(getWriteBudget);

    const loadProfile = useCallback(async () => {
        ensureEstudianteSessionBootstrap();
        const id = localStorage.getItem('student_id') || '';
        const name = localStorage.getItem('student_name') || '';
        if (!id) {
            setLoading(false);
            router.push('/login');
            return;
        }

        // Demo student — block profile
        if (id === 'demo') {
            setStudentId('demo');
            setStudentName(name || 'Estudiante Demo');
            setLoading(false);
            return;
        }

        setStudentId(id);
        setStudentName(name);

        try {
            const cachedData = localStorage.getItem(`sg_v8_results_${id}`);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                if (parsed.data?.informacion_personal) {
                    setInstitucion(parsed.data.informacion_personal.institucion || '');
                    setDepartamento(parsed.data.informacion_personal.departamento || '');
                }
                // Bandera de corrección automática generada por el pipeline
                if (parsed.data?.correccion_datos === true) {
                    setCorreccionDatos(true);
                }
            }
        } catch { /* ignore */ }

        try {
            const profile = await getStudentProfile(id);
            if (profile) {
                setBio(profile.bio || '');
                setSocials(profile.socials || {});

                if (profile.photoUrl) {
                    setPhotoUrl(profile.photoUrl);
                    setPhotoDeleteUrl(profile.photoDeleteUrl || null);
                    setIsGooglePhoto(false);
                } else {
                    // Fallback: foto de Google Auth
                    const googlePhoto = profile.googlePhotoUrl || localStorage.getItem('google_photo_url');
                    if (googlePhoto) {
                        setPhotoUrl(googlePhoto);
                        setIsGooglePhoto(true);
                    }
                }

                // Check photo cooldown
                const lastChange = localStorage.getItem(`photo_changed_${id}`);
                if (lastChange) {
                    const daysSince = Math.floor((Date.now() - parseInt(lastChange)) / (1000 * 60 * 60 * 24));
                    const remaining = Math.max(0, 5 - daysSince);
                    setPhotoCooldownDays(remaining);
                }
            }
        } catch (err) { console.error('Error cargando perfil:', err); }

        setLoading(false);
    }, [router]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    // Step 1: File selected → check cooldown, then open crop modal
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        // Check cooldown
        if (photoCooldownDays > 0) {
            setError(`Podrás cambiar tu foto en ${photoCooldownDays} día${photoCooldownDays !== 1 ? 's' : ''}. Solo se permite un cambio cada cinco días.`);
            return;
        }
        setCropFile(file);
    };

    // Step 2: Crop confirmed → check if replacing existing photo
    const handleCropConfirm = useCallback((croppedBlob: Blob) => {
        setCropFile(null);
        if (photoUrl && photoDeleteUrl) {
            // Has existing photo — ask for confirmation
            setPendingCropBlob(croppedBlob);
            setShowConfirmReplace(true);
        } else {
            // No existing photo — upload directly
            uploadCroppedPhoto(croppedBlob);
        }
    }, [photoUrl, photoDeleteUrl]);

    // Step 3: Upload cropped blob to ImgBB
    const uploadCroppedPhoto = async (blob: Blob) => {
        setUploading(true);
        setError('');
        try {
            // Delete old photo (best-effort)
            if (photoDeleteUrl) {
                deleteFromImgBB(photoDeleteUrl).catch(() => { });
            }

            const result = await uploadBlobToImgBB(blob);
            setPhotoUrl(result.url);
            setPhotoDeleteUrl(result.deleteUrl);
            await saveStudentProfile(studentId, {
                photoUrl: result.url,
                photoThumb: result.thumb,
                photoDeleteUrl: result.deleteUrl,
                bio,
                socials,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            // Set cooldown (5 days)
            localStorage.setItem(`photo_changed_${studentId}`, Date.now().toString());
            setPhotoCooldownDays(5);
            setIsGooglePhoto(false);
        } catch (err) {
            setError(STUDENT_ERRORS.photoUploadFailed);
        } finally {
            setUploading(false);
            setPendingCropBlob(null);
            setShowConfirmReplace(false);
        }
    };

    // Confirmation dialog: proceed with replacement
    const handleConfirmReplace = () => {
        if (pendingCropBlob) uploadCroppedPhoto(pendingCropBlob);
    };
    const handleCancelReplace = () => {
        setPendingCropBlob(null);
        setShowConfirmReplace(false);
    };

    // Resync Google photo manually
    const handleGoogleSync = () => {
        const gp = localStorage.getItem('google_photo_url');
        if (gp) {
            setPhotoUrl(gp);
            setIsGooglePhoto(true);
            setPhotoDeleteUrl(null);
            setSaved(false);
        } else {
            setError('No se encontró foto de Google. Cierra sesión y vuelve a iniciar con Google.');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await saveStudentProfile(studentId, { photoUrl: photoUrl || undefined, bio, socials });
            setSaved(true);
            setWriteBudget(getWriteBudget());
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(STUDENT_ERRORS.profileSaveFailed);
        } finally { setSaving(false); }
    };

    const updateSocial = (key: string, value: string) => {
        setSocials(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    if (loading) {
        return <PerfilSkeleton message="Cargando perfil" />;
    }

    if (studentId === 'demo') {
        return (
            <>
                <style>{CSS}</style>
                <div className="prf-page" style={{ display: 'flex', flexDirection: 'column' }}>
                    <header className="prf-header">
                        <button className="prf-back" onClick={() => router.back()} aria-label="Volver">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
                        </button>
                        <span className="prf-title">Mi Perfil</span>
                    </header>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', gap: '16px' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                        </div>
                        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Perfil no disponible</h2>
                        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
                            La personalización de perfil está disponible solo para estudiantes registrados. Inicia sesión con tu cuenta para acceder.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            style={{ marginTop: 12, padding: '12px 28px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
                        >
                            Iniciar sesión
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const nameParts = studentName.trim().split(/\s+/);
    const visibleStudentName = displayStudentName(
        nameParts[0],
        nameParts.slice(1).join(' ') || undefined,
    );
    const visibleStudentId = displayDocumentId(studentId);

    return (
        <>
            <style>{CSS}</style>
            <div className="prf-page">

                {/* ═══ Header ═══ */}
                <header className="prf-header">
                    <button className="prf-back" onClick={() => router.back()} aria-label="Volver">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <span className="prf-title">Mi Perfil</span>
                </header>

                {/* ═══ Hero: Avatar + Name ═══ */}
                <section className="prf-hero">
                    <div className="prf-avatar-wrap">
                        <div
                            className="prf-avatar"
                            onClick={() => fileInputRef.current?.click()}
                            style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : {}}
                        >
                            {!photoUrl && <span className="prf-avatar-initial">{studentName.charAt(0) || '?'}</span>}
                            {uploading && (
                                <div className="prf-avatar-overlay">
                                    <div className="prf-spinner" />
                                </div>
                            )}
                        </div>
                        <button
                            className="prf-cam-btn"
                            onClick={() => photoCooldownDays > 0 ? setError(`Podrás cambiar tu foto en ${photoCooldownDays} día${photoCooldownDays !== 1 ? 's' : ''}`) : fileInputRef.current?.click()}
                            disabled={uploading}
                            aria-label="Cambiar foto de perfil"
                            style={photoCooldownDays > 0 ? { background: '#475569', cursor: 'not-allowed' } : {}}
                        >
                            {photoCooldownDays > 0 ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            )}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                    </div>

                    <h2 className="prf-name">{visibleStudentName}</h2>
                    <p className="prf-id-text">{visibleStudentId}</p>
                    {institucion && <p className="prf-inst">🏫 {institucion}{departamento ? ` · ${departamento}` : ''}</p>}

                    {/* Google photo sync button */}
                    {isGooglePhoto && (
                        <button className="prf-google-btn" onClick={handleGoogleSync} style={{ margin: '8px auto 0' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                            Sincronizar foto de Google
                        </button>
                    )}
                    {!isGooglePhoto && !photoUrl && localStorage.getItem('google_photo_url') && (
                        <button className="prf-google-btn" onClick={handleGoogleSync} style={{ margin: '8px auto 0' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Usar foto de Google
                        </button>
                    )}
                </section>

                <CourseProfileShortcut />

                {/* ═══ Banner de corrección automática de datos ═══ */}
                {correccionDatos && (
                    <div className="prf-correccion" role="alert">
                        <div className="prf-correccion-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="prf-correccion-body">
                            <div className="prf-correccion-title">Resultado ajustado</div>
                            <div className="prf-correccion-text">
                                Tu resultado fue ajustado por inconsistencia en los datos registrados durante el simulacro.
                                En futuras pruebas, por favor verifica que tu número de ID y nombre completo estén escritos
                                correctamente en <strong style={{ color: '#fbbf24' }}>ambas sesiones</strong>.
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ Card: Datos Verificados (NO editables) ═══ */}
                <div className="prf-card">
                    <div className="prf-card-header">
                        <span className="prf-card-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            Datos verificados
                        </span>
                        <span className="prf-verified">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            No editable
                        </span>
                    </div>
                    <div className="prf-card-body" style={{ display: 'grid', gap: '10px' }}>
                        <div>
                            <div className="prf-locked-label">Nombre completo</div>
                            <div className="prf-locked-field">
                                <span>{visibleStudentName}</span>
                                <span className="prf-lock-icon">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="prf-locked-label">Número de identificación</div>
                            <div className="prf-locked-field" style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                                <span>{visibleStudentId}</span>
                                <span className="prf-lock-icon">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Card: Sobre ti (editable) ═══ */}
                <div className="prf-card">
                    <div className="prf-card-header">
                        <span className="prf-card-label">✏️ Sobre ti</span>
                    </div>
                    <div className="prf-card-body">
                        <textarea
                            className="prf-input prf-textarea"
                            value={bio}
                            onChange={e => { setBio(e.target.value); setSaved(false); }}
                            placeholder="Escribe algo sobre ti... Tus metas, lo que te apasiona, tu carrera soñada..."
                            maxLength={200}
                            rows={3}
                        />
                        <div className="prf-char-count">{bio.length}/200</div>
                    </div>
                </div>

                {/* ═══ Card: Redes sociales (editable) ═══ */}
                <div className="prf-card">
                    <div className="prf-card-header">
                        <span className="prf-card-label">🔗 Redes sociales</span>
                    </div>
                    <div className="prf-card-body" style={{ display: 'grid', gap: '10px' }}>
                        {SOCIAL_CONFIG.map(social => (
                            <div key={social.key} className="prf-social-item">
                                <div
                                    className="prf-social-icon"
                                    style={{
                                        background: `${social.color}18`,
                                        color: social.color,
                                        border: `1px solid ${social.color}25`,
                                    }}
                                >
                                    {social.icon}
                                </div>
                                <input
                                    className="prf-input"
                                    type="text"
                                    placeholder={social.placeholder}
                                    value={socials[social.key as keyof StudentSocials] || ''}
                                    onChange={e => updateSocial(social.key, e.target.value)}
                                    aria-label={social.label}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ Cooldown banner ═══ */}
                {photoCooldownDays > 0 && (
                    <div className="prf-cooldown">
                        <div className="prf-cooldown-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <div className="prf-cooldown-text">
                            Podrás cambiar tu foto en <strong>{photoCooldownDays} día{photoCooldownDays !== 1 ? 's' : ''}</strong>. Límite: 1 cambio cada 5 días.
                        </div>
                    </div>
                )}

                {/* ═══ Error ═══ */}
                {error && <div className="prf-error">⚠️ {error}</div>}

                {/* ═══ Write budget ═══ */}
                <div className="prf-budget">
                    <span>Guardados hoy:</span>
                    <div className="prf-budget-dots">
                        {Array.from({ length: writeBudget.max }, (_, i) => (
                            <div key={i} className={`prf-budget-dot ${i < writeBudget.used ? 'used' : 'empty'}`} />
                        ))}
                    </div>
                    <span>{writeBudget.max - writeBudget.used} restantes</span>
                </div>

                {/* ═══ Save ═══ */}
                <div style={{ padding: '0 16px 32px' }}>
                    <button
                        className={`prf-save ${saved ? 'prf-save--success' : 'prf-save--default'}`}
                        onClick={handleSave}
                        disabled={saving || saved}
                    >
                        {saving ? (
                            <><div className="prf-spinner prf-spinner--sm" /> Guardando...</>
                        ) : saved ? (
                            <>✓ Perfil guardado</>
                        ) : (
                            <>Guardar cambios</>
                        )}
                    </button>
                </div>

                {/* ═══ Crop Modal ═══ */}
                {cropFile && (
                    <PhotoCropModal
                        imageFile={cropFile}
                        onConfirm={handleCropConfirm}
                        onCancel={() => setCropFile(null)}
                    />
                )}

                {/* ═══ Confirm Replace Dialog ═══ */}
                {showConfirmReplace && (
                    <div className="prf-confirm-overlay">
                        <div className="prf-confirm-dialog">
                            <div className="prf-confirm-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            </div>
                            <h3 className="prf-confirm-title">¿Cambiar foto de perfil?</h3>
                            <p className="prf-confirm-text">Tu foto anterior se eliminará de forma definitiva y será reemplazada por la nueva.</p>
                            <div className="prf-confirm-actions">
                                <button className="prf-confirm-btn prf-confirm-btn--cancel" onClick={handleCancelReplace}>Cancelar</button>
                                <button className="prf-confirm-btn prf-confirm-btn--confirm" onClick={handleConfirmReplace} disabled={uploading}>
                                    {uploading ? 'Subiendo...' : 'Sí, cambiar foto'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
