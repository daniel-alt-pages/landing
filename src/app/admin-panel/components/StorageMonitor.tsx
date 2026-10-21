'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getLocalStorageInventory,
    getLocalStorageUsageBytes,
    clearDataCaches,
    emergencyClearAll,
    autoCleanIfNeeded,
    formatBytes,
} from '@/lib/storageCleanup';

interface InventoryItem {
    key: string;
    bytes: number;
    isCache: boolean;
}

const QUOTA_LIMIT = 5 * 1024 * 1024; // 5MB típico

function UsageBar({ usedBytes }: { usedBytes: number }) {
    const pct = Math.min((usedBytes / QUOTA_LIMIT) * 100, 100);
    const color =
        pct > 85 ? '#ef4444' :
        pct > 65 ? '#f59e0b' :
        '#10b981';

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
                <span>{formatBytes(usedBytes)} usado</span>
                <span>{formatBytes(QUOTA_LIMIT)} límite típico</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <div className="text-right text-xs" style={{ color }}>
                {pct.toFixed(1)}% consumido
            </div>
        </div>
    );
}

export default function StorageMonitor() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [totalBytes, setTotalBytes] = useState(0);
    const [cacheBytes, setCacheBytes] = useState(0);
    const [sessionBytes, setSessionBytes] = useState(0);
    const [lastClean, setLastClean] = useState<string | null>(null);
    const [freedBytes, setFreedBytes] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);

    const refresh = useCallback(() => {
        const inv = getLocalStorageInventory();
        const total = getLocalStorageUsageBytes();
        const cacheTotal = inv.filter(i => i.isCache).reduce((s, i) => s + i.bytes, 0);

        setInventory(inv);
        setTotalBytes(total);
        setCacheBytes(cacheTotal);
        setSessionBytes(total - cacheTotal);
        setFreedBytes(null);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleClearCaches = () => {
        const freed = clearDataCaches();
        setFreedBytes(freed);
        setLastClean(new Date().toLocaleTimeString('es-CO'));
        setTimeout(refresh, 300);
    };

    const handleEmergencyClear = () => {
        if (!confirm('⚠️ Esto borrará TODOS los cachés (se conserva la sesión). ¿Continuar?')) return;
        const freed = emergencyClearAll();
        setFreedBytes(freed);
        setLastClean(new Date().toLocaleTimeString('es-CO') + ' [EMERGENCIA]');
        setTimeout(refresh, 300);
    };

    const handleAutoClean = () => {
        autoCleanIfNeeded();
        setTimeout(refresh, 300);
    };

    const displayedItems = showAll ? inventory : inventory.slice(0, 15);
    const cacheItems = inventory.filter(i => i.isCache);
    const sessionItems = inventory.filter(i => !i.isCache);
    const pctUsed = (totalBytes / QUOTA_LIMIT) * 100;

    const statusColor =
        pctUsed > 85 ? 'text-red-400' :
        pctUsed > 65 ? 'text-yellow-400' :
        'text-emerald-400';

    const statusText =
        pctUsed > 85 ? '⛔ Crítico — riesgo de QuotaExceededError' :
        pctUsed > 65 ? '⚠️ Elevado — limpiar pronto' :
        '✅ Normal';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        🗄️ Monitor de Almacenamiento
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Gestión del localStorage del navegador — previene errores de quota en Firestore
                    </p>
                </div>
                <button
                    onClick={refresh}
                    className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                    🔄 Actualizar
                </button>
            </div>

            {/* Status card */}
            <div className={`rounded-xl border p-4 space-y-3 ${pctUsed > 85 ? 'border-red-500/40 bg-red-500/5' : pctUsed > 65 ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${statusColor}`}>{statusText}</span>
                    {lastClean && (
                        <span className="text-xs text-gray-500">Última limpieza: {lastClean}</span>
                    )}
                </div>
                <UsageBar usedBytes={totalBytes} />
                {freedBytes !== null && (
                    <div className="text-xs text-emerald-400 font-medium">
                        ✅ Liberados {formatBytes(freedBytes)} en esta sesión
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-white">{formatBytes(totalBytes)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Total usado</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-amber-300">{formatBytes(cacheBytes)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Cachés ({cacheItems.length} ítems)</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-blue-300">{formatBytes(sessionBytes)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Sesión ({sessionItems.length} ítems)</div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleClearCaches}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-lg transition-all"
                >
                    🧹 Limpiar cachés de datos
                    <span className="text-xs text-amber-400/70">({formatBytes(cacheBytes)})</span>
                </button>
                <button
                    onClick={handleAutoClean}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg transition-all"
                >
                    🤖 Auto-limpieza inteligente
                </button>
                <button
                    onClick={handleEmergencyClear}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all"
                >
                    ⚡ Limpieza de emergencia
                </button>
            </div>

            {/* Inventory table */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-white/5 px-4 py-2.5 flex items-center justify-between border-b border-white/10">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                        Inventario localStorage ({inventory.length} ítems)
                    </span>
                    <span className="text-xs text-gray-500">Ordenado por tamaño</span>
                </div>
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                    {displayedItems.map(item => (
                        <div
                            key={item.key}
                            className={`flex items-center justify-between px-4 py-2.5 text-xs ${item.isCache ? 'bg-amber-500/5' : ''}`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className={`shrink-0 w-2 h-2 rounded-full ${item.isCache ? 'bg-amber-400' : 'bg-blue-400'}`} />
                                <span className="text-gray-300 font-mono truncate max-w-xs" title={item.key}>
                                    {item.key}
                                </span>
                                {item.isCache && (
                                    <span className="shrink-0 text-amber-400/60 text-[10px] border border-amber-400/20 rounded px-1">caché</span>
                                )}
                            </div>
                            <div className="shrink-0 ml-4">
                                <span className={`font-mono font-medium ${item.bytes > 50000 ? 'text-red-400' : item.bytes > 10000 ? 'text-amber-400' : 'text-gray-400'}`}>
                                    {formatBytes(item.bytes)}
                                </span>
                            </div>
                        </div>
                    ))}
                    {!showAll && inventory.length > 15 && (
                        <button
                            onClick={() => setShowAll(true)}
                            className="w-full text-center py-3 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                        >
                            Mostrar {inventory.length - 15} ítems más ▼
                        </button>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Cachés eliminables</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Datos de sesión (no se eliminan)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Ítem &gt;50KB (crítico)</span>
            </div>
        </div>
    );
}
