/** Etiqueta legible para selectores / WhatsApp (SG11-20 → Simulacro 20). */
export function formatSimulationDisplayLabel(simId: string): string {
    const id = String(simId || '').trim();
    if (!id) return '';
    const m = id.match(/^SG11-(\d+X?)$/i);
    if (m) return `Simulacro ${m[1].toUpperCase()}`;
    return id;
}
