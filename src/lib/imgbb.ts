/**
 * ImgBB Upload Service
 * Sube imágenes a ImgBB y retorna la URL pública
 */

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';
const IMGBB_ENDPOINT = 'https://api.imgbb.com/1/upload';

export interface ImgBBResponse {
    data: {
        id: string;
        title: string;
        url_viewer: string;
        url: string;
        display_url: string;
        width: number;
        height: number;
        size: number;
        time: number;
        expiration: number;
        image: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        thumb: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        medium?: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        delete_url: string;
    };
    success: boolean;
    status: number;
}

/**
 * Comprime un Blob de imagen a máximo maxSize px y calidad JPEG
 * Reduce drásticamente el tamaño: 5MB → ~100KB
 */
async function compressImage(blob: Blob, maxSize = 400, quality = 0.75): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Redimensionar manteniendo proporción
            if (width > height) {
                if (width > maxSize) {
                    height = Math.round(height * maxSize / width);
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = Math.round(width * maxSize / height);
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (result) => result ? resolve(result) : reject(new Error('Compression failed')),
                'image/jpeg',
                quality
            );
        };
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Sube un Blob (e.g. desde canvas crop) a ImgBB
 * Comprime automáticamente a 400x400 JPEG antes de subir
 */
export async function uploadBlobToImgBB(blob: Blob): Promise<{ url: string; thumb: string; deleteUrl: string }> {
    // Comprimir antes de subir (5MB → ~100KB)
    const compressed = await compressImage(blob);
    console.log(`[ImgBB] Compressed: ${(blob.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`);

    if (compressed.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar 5MB');
    }

    const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
    });

    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64);
    formData.append('name', `profile_${Date.now()}`);

    const response = await fetch(IMGBB_ENDPOINT, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Error al subir imagen: ${response.statusText}`);
    }

    const data: ImgBBResponse = await response.json();
    if (!data.success) {
        throw new Error('Error al procesar la imagen en ImgBB');
    }

    return {
        url: data.data.display_url,
        thumb: data.data.thumb.url,
        deleteUrl: data.data.delete_url,
    };
}

/**
 * Intenta eliminar una imagen de ImgBB (best-effort)
 * Usa el deleteUrl retornado al subir la imagen
 */
export async function deleteFromImgBB(deleteUrl: string): Promise<boolean> {
    if (!deleteUrl) return false;
    try {
        console.log('[ImgBB] Deleting old photo...');
        // ImgBB delete URLs are direct links — fetch them to trigger deletion
        const response = await fetch(deleteUrl, { mode: 'no-cors' });
        console.log('[ImgBB] Delete request sent, status:', response.type);
        return true;
    } catch (err) {
        console.warn('[ImgBB] Failed to delete old photo (best-effort):', err);
        return false;
    }
}

