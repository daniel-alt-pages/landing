/**
 * Profile Service — Guarda y carga perfiles de estudiantes
 * 
 * Datos almacenados en Firestore: students/{id} (merge)
 * Campos de perfil: photoUrl, bio, socials, profileUpdatedAt
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@features/auth/lib/firebase';

// Cache en memoria para fotos (evita reads repetidos)
let photoCacheData: Map<string, string> | null = null;
let photoCacheTimestamp = 0;
const PHOTO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días — las fotos casi nunca cambian

// 🛡️ READ BUDGET para profileService
// Límite estricto: máximo 5 reads por sesión (getStudentProfile + getAllProfilePhotos)
// Después de eso, todo se lee de localStorage cache
let _profileReads = 0;
const MAX_PROFILE_READS = 5;

function canProfileRead(source: string): boolean {
    if (isLocal) return true;
    if (_profileReads >= MAX_PROFILE_READS) {
        console.warn(`[ProfileBudget] ⛔ Límite reads alcanzado (${MAX_PROFILE_READS}). Fuente: ${source}`);
        return false;
    }
    _profileReads++;
    return true;
}

// 🛡️ WRITE BUDGET — máximo 5 writes por usuario por día
// Se guarda en localStorage con fecha para resetear cada día
const MAX_PROFILE_WRITES_PER_DAY = 5;

function canProfileWrite(source: string): boolean {
    if (isLocal) return true;
    if (typeof window === 'undefined') return false;

    const today = new Date().toISOString().slice(0, 10); // "2026-03-05"
    const key = 'profile_write_budget';

    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const { date, count } = JSON.parse(stored);
            if (date === today) {
                if (count >= MAX_PROFILE_WRITES_PER_DAY) {
                    console.warn(`[WriteBudget] ⛔ Límite diario alcanzado (${MAX_PROFILE_WRITES_PER_DAY} writes). Fuente: ${source}`);
                    return false;
                }
                localStorage.setItem(key, JSON.stringify({ date: today, count: count + 1 }));
            } else {
                // Nuevo día → resetear contador
                localStorage.setItem(key, JSON.stringify({ date: today, count: 1 }));
            }
        } else {
            localStorage.setItem(key, JSON.stringify({ date: today, count: 1 }));
        }
    } catch { /* si localStorage falla, permitir */ }

    return true;
}

export interface StudentSocials {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    whatsapp?: string;
    linkedin?: string;
    youtube?: string;
}

export interface StudentProfileData {
    photoUrl?: string;
    photoThumb?: string;
    photoDeleteUrl?: string;
    bio?: string;
    socials?: StudentSocials;
    profileUpdatedAt?: string;
    googlePhotoUrl?: string; // Fallback desde Google Auth (CDN gratis)
}

// POST-MIGRACIÓN: Firestore es la única fuente de verdad
const isLocal = false;

/**
 * Carga el perfil del estudiante desde Firestore
 * Si hay datos en localStorage pero no en Firestore, auto-sincroniza
 */
export async function getStudentProfile(studentId: string): Promise<StudentProfileData | null> {
    if (!studentId || studentId === 'demo') return null;

    // En local, intentar leer de localStorage
    if (isLocal) {
        const cached = localStorage.getItem(`profile_${studentId}`);
        if (cached) {
            try {
                const parsed = JSON.parse(cached) as StudentProfileData;
                // Inyectar Google photo si no tiene foto custom
                if (!parsed.photoUrl) {
                    const gp = localStorage.getItem('google_photo_url');
                    if (gp) parsed.googlePhotoUrl = gp;
                }
                return parsed;
            } catch { /* ignore */ }
        }
        // Sin cache pero con foto de Google → retornar perfil mínimo
        const googlePhoto = localStorage.getItem('google_photo_url');
        if (googlePhoto) {
            return { googlePhotoUrl: googlePhoto };
        }
        return null;
    }

    // Intentar localStorage primero (evita read si ya hay datos)
    const cached = localStorage.getItem(`profile_${studentId}`);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch { /* ignore */ }
    }

    // 🛡️ Verificar presupuesto antes de Firestore
    if (!canProfileRead('getStudentProfile')) return null;

    try {
        const docRef = doc(db, 'students', studentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const firestoreProfile: StudentProfileData = {
                photoUrl: data.photoUrl || null,
                photoThumb: data.photoThumb || null,
                photoDeleteUrl: data.photoDeleteUrl || null,
                bio: data.bio || '',
                socials: data.socials || {},
                profileUpdatedAt: data.profileUpdatedAt || null,
            };

            // Si Firestore NO tiene foto pero localStorage SÍ, auto-sync
            if (!firestoreProfile.photoUrl) {
                const cached = localStorage.getItem(`profile_${studentId}`);
                if (cached) {
                    try {
                        const cachedProfile = JSON.parse(cached) as StudentProfileData;
                        if (cachedProfile.photoUrl) {
                            // 🛡️ Solo sincronizar si hay presupuesto
                            if (canProfileWrite('autoSync')) {
                                console.log('[Profile] Auto-syncing cached photo to Firestore...');
                                setDoc(docRef, {
                                    photoUrl: cachedProfile.photoUrl,
                                    photoThumb: cachedProfile.photoThumb || null,
                                    bio: cachedProfile.bio || firestoreProfile.bio,
                                    socials: cachedProfile.socials || firestoreProfile.socials,
                                    profileUpdatedAt: new Date().toISOString(),
                                }, { merge: true }).catch(e => console.warn('[Profile] Auto-sync failed:', e));
                            }
                            // Retornar datos combinados inmediatamente
                            return { ...firestoreProfile, ...cachedProfile };
                        }
                    } catch { /* ignore */ }
                }

                // Fallback: usar foto de Google Auth (0 reads, CDN gratis)
                // Se guardó en localStorage al hacer login con Google
                const googlePhoto = typeof window !== 'undefined' ? localStorage.getItem('google_photo_url') : null;
                if (googlePhoto) {
                    firestoreProfile.googlePhotoUrl = googlePhoto;
                    // Solo sincronizar al índice si no se ha hecho antes (evita writes repetidos)
                    const syncKey = `google_photo_synced_${studentId}`;
                    const alreadySynced = localStorage.getItem(syncKey);
                    if (!alreadySynced) {
                        console.log('[Profile] Primera vez: sincronizando foto de Google al índice...');
                        syncPhotoToIndex(studentId, googlePhoto)
                            .then(() => localStorage.setItem(syncKey, '1'))
                            .catch(e => console.warn('[Profile] Google photo index sync failed:', e));
                    }
                }
            }

            // Cache en localStorage
            localStorage.setItem(`profile_${studentId}`, JSON.stringify(firestoreProfile));
            return firestoreProfile;
        }
        return null;
    } catch (error) {
        console.error('Error cargando perfil:', error);
        // Fallback a localStorage si Firestore falla
        const cached = localStorage.getItem(`profile_${studentId}`);
        if (cached) {
            try { return JSON.parse(cached); } catch { /* ignore */ }
        }
        return null;
    }
}

/**
 * Guarda el perfil del estudiante en Firestore (merge)
 */
export async function saveStudentProfile(studentId: string, profile: StudentProfileData): Promise<void> {
    if (!studentId || studentId === 'demo') {
        // En demo, guardar en localStorage
        localStorage.setItem(`profile_${studentId}`, JSON.stringify(profile));
        return;
    }

    const profileData = {
        ...profile,
        profileUpdatedAt: new Date().toISOString(),
    };

    // En local, solo guardar en localStorage
    if (isLocal) {
        localStorage.setItem(`profile_${studentId}`, JSON.stringify(profileData));
        return;
    }

    // 🛡️ Verificar presupuesto de writes antes de Firestore
    if (!canProfileWrite('saveStudentProfile')) {
        // Guardar solo en localStorage si se agotó el presupuesto
        localStorage.setItem(`profile_${studentId}`, JSON.stringify(profileData));
        console.warn('[WriteBudget] Perfil guardado solo en localStorage (límite diario alcanzado)');
        return;
    }

    try {
        const docRef = doc(db, 'students', studentId);
        await updateDoc(docRef, profileData);

        // También guardar en localStorage como cache
        localStorage.setItem(`profile_${studentId}`, JSON.stringify(profileData));

        // Sincronizar foto al índice centralizado (en background)
        if (profile.photoUrl) {
            syncPhotoToIndex(studentId, profile.photoUrl).catch(e =>
                console.warn('[Profile] Photo index sync failed:', e)
            );
        }
    } catch (error) {
        console.error('Error guardando perfil:', error);
        throw new Error('No se pudo guardar el perfil. Intenta de nuevo.');
    }
}

/**
 * Sincroniza la foto de un estudiante al índice centralizado
 * Documento: config/profilePhotos → { photos: { [studentId]: url } }
 * Costo: 1 write (solo cuando el estudiante sube/cambia foto)
 */
async function syncPhotoToIndex(studentId: string, photoUrl: string): Promise<void> {
    if (isLocal) return;
    // 🛡️ Verificar presupuesto antes de escribir
    if (!canProfileWrite('syncPhotoToIndex')) return;
    try {
        const indexRef = doc(db, 'config', 'profilePhotos');
        await setDoc(indexRef, {
            photos: { [studentId]: photoUrl },
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        // Invalidar cache en memoria
        photoCacheData = null;
        console.log('[Profile] Photo synced to index');
    } catch (e) {
        console.warn('[Profile] Failed to sync photo index:', e);
    }
}

/**
 * Obtiene TODAS las fotos de perfil de un solo documento
 * Incluye fotos custom (ImgBB) + fotos de Google Auth como fallback
 * Costo: 1 read (en vez de 300 reads leyendo cada estudiante)
 * Cache: 7 días en memoria + localStorage
 */
export async function getAllProfilePhotos(): Promise<Map<string, string>> {
    // Cache en memoria
    if (photoCacheData && (Date.now() - photoCacheTimestamp < PHOTO_CACHE_TTL)) {
        return photoCacheData;
    }

    // Cache en localStorage
    const persistKey = 'profilePhotos_cache';
    const persisted = localStorage.getItem(persistKey);
    if (persisted) {
        try {
            const { data, ts } = JSON.parse(persisted);
            if (Date.now() - ts < PHOTO_CACHE_TTL) {
                const map = new Map<string, string>(Object.entries(data));
                photoCacheData = map;
                photoCacheTimestamp = ts;
                return map;
            }
        } catch { /* ignore */ }
    }

    if (isLocal) return new Map();

    // 🛡️ Verificar presupuesto antes de Firestore
    if (!canProfileRead('getAllProfilePhotos')) return new Map();

    try {
        const indexRef = doc(db, 'config', 'profilePhotos');
        const snap = await getDoc(indexRef);
        const photos = snap.exists() ? (snap.data().photos || {}) : {};
        const map = new Map<string, string>(Object.entries(photos));

        // Guardar caches
        photoCacheData = map;
        photoCacheTimestamp = Date.now();
        localStorage.setItem(persistKey, JSON.stringify({
            data: photos,
            ts: Date.now(),
        }));

        return map;
    } catch (e) {
        console.warn('[Profile] Failed to load photo index:', e);
        return new Map();
    }
}

/**
 * Obtiene la foto efectiva de un estudiante (custom > Google > null)
 * 0 reads — todo desde cache/localStorage
 */
export function getEffectivePhoto(studentId: string, photosMap?: Map<string, string>): string | null {
    // 1. Foto del índice centralizado (custom ImgBB o Google sincronizada)
    if (photosMap?.has(studentId)) {
        return photosMap.get(studentId)!;
    }

    // 2. Foto de Google del usuario actual (solo para su propia foto)
    const currentStudentId = typeof window !== 'undefined' ? localStorage.getItem('student_id') : null;
    if (studentId === currentStudentId) {
        const googlePhoto = typeof window !== 'undefined' ? localStorage.getItem('google_photo_url') : null;
        if (googlePhoto) return googlePhoto;
    }

    return null;
}
