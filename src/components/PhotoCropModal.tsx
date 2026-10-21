'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
 *  PhotoCropModal v3 — Editor de fotos futurista
 *  - Drag + pinch/wheel zoom
 *  - Rotación 360°
 *  - 8 filtros preset estilo Instagram
 *  - Ajustes finos (brillo, contraste, saturación)
 *  - Flip horizontal
 *  - Preview circular en vivo
 *  - Todo con Canvas API — 0 dependencies, 0 network cost
 * ═══════════════════════════════════════════════════════════════ */

interface Props {
    imageFile: File;
    onConfirm: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

const CROP_SIZE = 260;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;

// Filtros preset — cada uno es un combo de CSS filter values
const FILTER_PRESETS = [
    { name: 'Original', icon: '✨', brightness: 100, contrast: 100, saturate: 100, hueRotate: 0, sepia: 0, grayscale: 0 },
    { name: 'Vivid', icon: '🔥', brightness: 105, contrast: 115, saturate: 140, hueRotate: 0, sepia: 0, grayscale: 0 },
    { name: 'Cool', icon: '❄️', brightness: 100, contrast: 105, saturate: 90, hueRotate: 195, sepia: 10, grayscale: 0 },
    { name: 'Warm', icon: '☀️', brightness: 105, contrast: 105, saturate: 120, hueRotate: -10, sepia: 15, grayscale: 0 },
    { name: 'B&W', icon: '🖤', brightness: 110, contrast: 120, saturate: 0, hueRotate: 0, sepia: 0, grayscale: 100 },
    { name: 'Sepia', icon: '📜', brightness: 100, contrast: 100, saturate: 80, hueRotate: 0, sepia: 60, grayscale: 0 },
    { name: 'Drama', icon: '🎭', brightness: 95, contrast: 140, saturate: 110, hueRotate: 0, sepia: 5, grayscale: 0 },
    { name: 'Neon', icon: '💜', brightness: 110, contrast: 120, saturate: 160, hueRotate: 280, sepia: 0, grayscale: 0 },
];

const CSS = `
.pcm-overlay{position:fixed;inset:0;z-index:9999;background:#000;display:flex;flex-direction:column;touch-action:none;user-select:none;font-family:'Inter',-apple-system,sans-serif}

/* Header */
.pcm-header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:linear-gradient(180deg,rgba(15,10,30,0.98),rgba(10,8,25,0.95));z-index:2;border-bottom:1px solid rgba(255,255,255,0.06)}
.pcm-header-btn{background:none;border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;transition:all 0.2s}
.pcm-header-btn:hover{background:rgba(255,255,255,0.1)}
.pcm-header-title{color:rgba(255,255,255,0.5);font-size:12px;font-weight:500;letter-spacing:0.04em}

/* Canvas area */
.pcm-canvas-area{flex:1;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,#0f0a1e 0%,#000 100%)}
.pcm-image{position:absolute;transform-origin:center center;cursor:grab;will-change:transform;transition:filter 0.3s ease}
.pcm-image:active{cursor:grabbing}
.pcm-guide{position:absolute;pointer-events:none;z-index:2}
.pcm-guide-ring{width:${CROP_SIZE}px;height:${CROP_SIZE}px;border-radius:50%;border:2px solid rgba(255,255,255,0.5);box-shadow:0 0 0 9999px rgba(0,0,0,0.6),0 0 40px rgba(99,102,241,0.15) inset;transition:border-color 0.3s}

/* Tabs */
.pcm-tabs{display:flex;gap:0;background:rgba(15,10,30,0.95);border-top:1px solid rgba(255,255,255,0.06);z-index:2}
.pcm-tab{flex:1;padding:8px 0 6px;text-align:center;cursor:pointer;border:none;background:none;color:rgba(255,255,255,0.4);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;transition:all 0.2s;border-bottom:2px solid transparent;display:flex;flex-direction:column;align-items:center;gap:3px}
.pcm-tab.active{color:#a78bfa;border-bottom-color:#a78bfa}
.pcm-tab:hover{color:rgba(255,255,255,0.7)}
.pcm-tab svg{opacity:0.6}
.pcm-tab.active svg{opacity:1}

/* Filters panel */
.pcm-panel{display:flex;gap:8px;padding:12px 16px;overflow-x:auto;background:rgba(10,8,25,0.95);z-index:2;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.pcm-panel::-webkit-scrollbar{display:none}

/* Filter preset buttons */
.pcm-filter-btn{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;border:none;background:none;transition:all 0.2s;flex-shrink:0}
.pcm-filter-thumb{width:56px;height:56px;border-radius:12px;border:2px solid rgba(255,255,255,0.08);overflow:hidden;transition:all 0.25s}
.pcm-filter-thumb.active{border-color:#a78bfa;box-shadow:0 0 16px rgba(167,139,250,0.3)}
.pcm-filter-thumb canvas{width:100%;height:100%;object-fit:cover}
.pcm-filter-name{font-size:9px;color:rgba(255,255,255,0.45);font-weight:600;letter-spacing:0.04em}
.pcm-filter-btn.active .pcm-filter-name{color:#a78bfa}

/* Adjust sliders */
.pcm-adjust-panel{padding:12px 20px;background:rgba(10,8,25,0.95);z-index:2;display:grid;gap:10px}
.pcm-adjust-row{display:flex;align-items:center;gap:12px}
.pcm-adjust-label{font-size:10px;color:rgba(255,255,255,0.4);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;width:70px;flex-shrink:0;display:flex;align-items:center;gap:5px}
.pcm-adjust-slider{flex:1;-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;background:rgba(255,255,255,0.1);outline:none;transition:opacity 0.2s}
.pcm-adjust-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#6366f1);cursor:pointer;box-shadow:0 2px 8px rgba(99,102,241,0.4);transition:transform 0.15s}
.pcm-adjust-slider::-webkit-slider-thumb:hover{transform:scale(1.2)}
.pcm-adjust-val{font-size:11px;color:rgba(255,255,255,0.35);font-family:'SF Mono','Fira Code',monospace;width:32px;text-align:right}

/* Tools panel */
.pcm-tools-panel{padding:14px 20px;background:rgba(10,8,25,0.95);z-index:2;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.pcm-tool-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 16px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);cursor:pointer;color:rgba(255,255,255,0.6);transition:all 0.2s;min-width:64px}
.pcm-tool-btn:hover{background:rgba(255,255,255,0.08);color:#fff}
.pcm-tool-btn:active{transform:scale(0.95)}
.pcm-tool-btn span{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em}

/* Bottom */
.pcm-bottom-bar{display:flex;align-items:center;justify-content:center;gap:20px;padding:14px 16px 28px;background:rgba(10,8,25,0.98);z-index:2}
.pcm-confirm-btn{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(34,197,94,0.35);transition:all 0.2s}
.pcm-confirm-btn:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(34,197,94,0.45)}
.pcm-confirm-btn:active{transform:scale(0.95)}

/* Preview */
.pcm-preview-wrap{position:absolute;bottom:16px;right:16px;z-index:3;display:flex;flex-direction:column;align-items:center;gap:3px}
.pcm-preview{width:56px;height:56px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);overflow:hidden;background:#1a1a2e;box-shadow:0 4px 16px rgba(0,0,0,0.4)}
.pcm-preview canvas{width:100%;height:100%}
.pcm-preview-label{color:rgba(255,255,255,0.3);font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em}

@keyframes pcm-spin{to{transform:rotate(360deg)}}
`;

type TabType = 'filters' | 'adjust' | 'tools';

export default function PhotoCropModal({ imageFile, onConfirm, onCancel }: Props) {
    const canvasAreaRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const filterThumbRefs = useRef<(HTMLCanvasElement | null)[]>([]);

    const [imgSrc, setImgSrc] = useState('');
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [processing, setProcessing] = useState(false);

    // Personalization state
    const [activeTab, setActiveTab] = useState<TabType>('filters');
    const [selectedFilter, setSelectedFilter] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturate, setSaturate] = useState(100);

    // Build CSS filter string combining preset + manual adjustments
    const getFilterString = useCallback((presetIdx?: number) => {
        const preset = FILTER_PRESETS[presetIdx ?? selectedFilter];
        const b = (preset.brightness / 100) * (brightness / 100);
        const c = (preset.contrast / 100) * (contrast / 100);
        const s = (preset.saturate / 100) * (saturate / 100);
        let f = `brightness(${b}) contrast(${c}) saturate(${s})`;
        if (preset.hueRotate) f += ` hue-rotate(${preset.hueRotate}deg)`;
        if (preset.sepia) f += ` sepia(${preset.sepia}%)`;
        if (preset.grayscale) f += ` grayscale(${preset.grayscale}%)`;
        return f;
    }, [selectedFilter, brightness, contrast, saturate]);

    // Load image
    useEffect(() => {
        const url = URL.createObjectURL(imageFile);
        setImgSrc(url);

        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            setImgSize({ w: img.naturalWidth, h: img.naturalHeight });

            const area = canvasAreaRef.current;
            if (area) {
                const minDim = Math.min(img.naturalWidth, img.naturalHeight);
                const initialZoom = (CROP_SIZE + 40) / minDim;
                const z = Math.max(MIN_ZOOM, Math.min(initialZoom, MAX_ZOOM));
                setZoom(z);

                const cx = (area.clientWidth / 2) - (img.naturalWidth * z / 2);
                const cy = (area.clientHeight / 2) - (img.naturalHeight * z / 2);
                setOffset({ x: cx, y: cy });
            }
        };
        img.src = url;

        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    // Draw filter thumbnails
    useEffect(() => {
        if (!imgRef.current || imgSize.w === 0) return;
        FILTER_PRESETS.forEach((preset, i) => {
            const canvas = filterThumbRefs.current[i];
            if (!canvas) return;
            canvas.width = 112;
            canvas.height = 112;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Center-crop the source image
            const img = imgRef.current!;
            const minDim = Math.min(img.naturalWidth, img.naturalHeight);
            const sx = (img.naturalWidth - minDim) / 2;
            const sy = (img.naturalHeight - minDim) / 2;

            ctx.filter = `brightness(${preset.brightness}%) contrast(${preset.contrast}%) saturate(${preset.saturate}%)${preset.hueRotate ? ` hue-rotate(${preset.hueRotate}deg)` : ''}${preset.sepia ? ` sepia(${preset.sepia}%)` : ''}${preset.grayscale ? ` grayscale(${preset.grayscale}%)` : ''}`;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 112, 112);
        });
    }, [imgSize]);

    // Draw live preview
    useEffect(() => {
        const canvas = previewCanvasRef.current;
        const area = canvasAreaRef.current;
        if (!canvas || !area || !imgRef.current || imgSize.w === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 128;
        canvas.height = 128;

        const areaCx = area.clientWidth / 2;
        const areaCy = area.clientHeight / 2;

        const cropLeft = (areaCx - CROP_SIZE / 2 - offset.x) / zoom;
        const cropTop = (areaCy - CROP_SIZE / 2 - offset.y) / zoom;
        const cropSizeInImg = CROP_SIZE / zoom;

        ctx.clearRect(0, 0, 128, 128);
        ctx.save();
        ctx.beginPath();
        ctx.arc(64, 64, 64, 0, Math.PI * 2);
        ctx.clip();

        // Apply filters
        ctx.filter = getFilterString();

        // Apply rotation + flip
        ctx.translate(64, 64);
        if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
        if (flipH) ctx.scale(-1, 1);
        ctx.translate(-64, -64);

        ctx.drawImage(
            imgRef.current,
            cropLeft, cropTop, cropSizeInImg, cropSizeInImg,
            0, 0, 128, 128
        );
        ctx.restore();
    }, [zoom, offset, imgSize, selectedFilter, rotation, flipH, brightness, contrast, saturate, getFilterString]);

    // Drag handlers
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        setDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [offset]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging) return;
        setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }, [dragging, dragStart]);

    const handlePointerUp = useCallback(() => { setDragging(false); }, []);

    // Touch zoom
    const lastTouchDist = useRef(0);
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (lastTouchDist.current > 0) {
                const scale = dist / lastTouchDist.current;
                setZoom(prev => Math.max(MIN_ZOOM, Math.min(prev * scale, MAX_ZOOM)));
            }
            lastTouchDist.current = dist;
        }
    }, []);

    const handleTouchEnd = useCallback(() => { lastTouchDist.current = 0; }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        setZoom(prev => Math.max(MIN_ZOOM, Math.min(prev * delta, MAX_ZOOM)));
    }, []);

    const zoomIn = () => setZoom(prev => Math.min(prev + 0.15, MAX_ZOOM));
    const zoomOut = () => setZoom(prev => Math.max(prev - 0.15, MIN_ZOOM));

    // Reset all
    const resetAll = () => {
        setSelectedFilter(0);
        setRotation(0);
        setFlipH(false);
        setBrightness(100);
        setContrast(100);
        setSaturate(100);
        // Re-center
        const area = canvasAreaRef.current;
        if (area && imgRef.current) {
            const minDim = Math.min(imgRef.current.naturalWidth, imgRef.current.naturalHeight);
            const z = (CROP_SIZE + 40) / minDim;
            setZoom(Math.max(MIN_ZOOM, Math.min(z, MAX_ZOOM)));
            setOffset({
                x: (area.clientWidth / 2) - (imgRef.current.naturalWidth * z / 2),
                y: (area.clientHeight / 2) - (imgRef.current.naturalHeight * z / 2),
            });
        }
    };

    // Export
    const handleConfirm = useCallback(async () => {
        const area = canvasAreaRef.current;
        if (!area || !imgRef.current) return;
        setProcessing(true);

        const exportCanvas = document.createElement('canvas');
        const size = 512;
        exportCanvas.width = size;
        exportCanvas.height = size;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        const areaCx = area.clientWidth / 2;
        const areaCy = area.clientHeight / 2;
        const cropLeft = (areaCx - CROP_SIZE / 2 - offset.x) / zoom;
        const cropTop = (areaCy - CROP_SIZE / 2 - offset.y) / zoom;
        const cropSizeInImg = CROP_SIZE / zoom;

        // Clip circle
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();

        // Apply filters + transforms
        ctx.filter = getFilterString();
        ctx.translate(size / 2, size / 2);
        if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
        if (flipH) ctx.scale(-1, 1);
        ctx.translate(-size / 2, -size / 2);

        ctx.drawImage(
            imgRef.current,
            cropLeft, cropTop, cropSizeInImg, cropSizeInImg,
            0, 0, size, size
        );

        exportCanvas.toBlob(
            (blob) => {
                if (blob) onConfirm(blob);
                setProcessing(false);
            },
            'image/webp',
            0.85
        );
    }, [offset, zoom, rotation, flipH, getFilterString, onConfirm]);

    // Image transform style
    const imgTransform = `translate(${offset.x}px, ${offset.y}px) scale(${zoom})${rotation ? ` rotate(${rotation}deg)` : ''}${flipH ? ' scaleX(-1)' : ''}`;

    return (
        <>
            <style>{CSS}</style>
            <div className="pcm-overlay">
                {/* Header */}
                <div className="pcm-header">
                    <button className="pcm-header-btn" onClick={onCancel}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                    <span className="pcm-header-title">Editor de foto</span>
                    <button className="pcm-header-btn" onClick={resetAll}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                        Reset
                    </button>
                </div>

                {/* Canvas area */}
                <div
                    ref={canvasAreaRef}
                    className="pcm-canvas-area"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                >
                    {imgSrc && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imgSrc}
                            alt="Crop preview"
                            className="pcm-image"
                            style={{
                                transform: imgTransform,
                                filter: getFilterString(),
                                transformOrigin: '0 0',
                            }}
                            draggable={false}
                        />
                    )}
                    <div className="pcm-guide" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <div className="pcm-guide-ring" />
                    </div>

                    {/* Mini preview */}
                    <div className="pcm-preview-wrap">
                        <div className="pcm-preview">
                            <canvas ref={previewCanvasRef} />
                        </div>
                        <span className="pcm-preview-label">Preview</span>
                    </div>
                </div>

                {/* Tab bar */}
                <div className="pcm-tabs">
                    <button className={`pcm-tab ${activeTab === 'filters' ? 'active' : ''}`} onClick={() => setActiveTab('filters')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" /></svg>
                        Filtros
                    </button>
                    <button className={`pcm-tab ${activeTab === 'adjust' ? 'active' : ''}`} onClick={() => setActiveTab('adjust')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
                        Ajustes
                    </button>
                    <button className={`pcm-tab ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                        Herram.
                    </button>
                </div>

                {/* Filter presets panel */}
                {activeTab === 'filters' && (
                    <div className="pcm-panel">
                        {FILTER_PRESETS.map((preset, i) => (
                            <button
                                key={preset.name}
                                className={`pcm-filter-btn ${selectedFilter === i ? 'active' : ''}`}
                                onClick={() => setSelectedFilter(i)}
                            >
                                <div className={`pcm-filter-thumb ${selectedFilter === i ? 'active' : ''}`}>
                                    <canvas ref={el => { filterThumbRefs.current[i] = el; }} />
                                </div>
                                <span className="pcm-filter-name">{preset.icon} {preset.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Adjust sliders panel */}
                {activeTab === 'adjust' && (
                    <div className="pcm-adjust-panel">
                        <div className="pcm-adjust-row">
                            <span className="pcm-adjust-label">☀️ Brillo</span>
                            <input type="range" className="pcm-adjust-slider" min="50" max="150" value={brightness} onChange={e => setBrightness(+e.target.value)} />
                            <span className="pcm-adjust-val">{brightness}%</span>
                        </div>
                        <div className="pcm-adjust-row">
                            <span className="pcm-adjust-label">◐ Contraste</span>
                            <input type="range" className="pcm-adjust-slider" min="50" max="200" value={contrast} onChange={e => setContrast(+e.target.value)} />
                            <span className="pcm-adjust-val">{contrast}%</span>
                        </div>
                        <div className="pcm-adjust-row">
                            <span className="pcm-adjust-label">🎨 Color</span>
                            <input type="range" className="pcm-adjust-slider" min="0" max="200" value={saturate} onChange={e => setSaturate(+e.target.value)} />
                            <span className="pcm-adjust-val">{saturate}%</span>
                        </div>
                    </div>
                )}

                {/* Tools panel */}
                {activeTab === 'tools' && (
                    <div className="pcm-tools-panel">
                        <button className="pcm-tool-btn" onClick={() => setRotation(r => (r - 90) % 360)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                            <span>Rotar -90°</span>
                        </button>
                        <button className="pcm-tool-btn" onClick={() => setRotation(r => (r + 90) % 360)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                            <span>Rotar +90°</span>
                        </button>
                        <button className="pcm-tool-btn" onClick={() => setFlipH(f => !f)} style={flipH ? { background: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.3)' } : {}}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" /><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" /><line x1="12" y1="20" x2="12" y2="4" /></svg>
                            <span>{flipH ? 'Restaurar' : 'Voltear'}</span>
                        </button>
                        <button className="pcm-tool-btn" onClick={zoomIn}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                            <span>Zoom +</span>
                        </button>
                        <button className="pcm-tool-btn" onClick={zoomOut}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                            <span>Zoom -</span>
                        </button>
                    </div>
                )}

                {/* Bottom bar */}
                <div className="pcm-bottom-bar">
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                        {Math.round(zoom * 100)}% · {FILTER_PRESETS[selectedFilter].name}
                        {rotation !== 0 ? ` · ${rotation}°` : ''}{flipH ? ' · ↔' : ''}
                    </span>
                    <button
                        className="pcm-confirm-btn"
                        onClick={handleConfirm}
                        disabled={processing}
                        aria-label="Confirmar"
                    >
                        {processing ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'pcm-spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                        ) : (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
