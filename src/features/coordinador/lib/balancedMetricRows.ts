/**
 * Calcula cuántas columnas caben cómodamente según el ancho del contenedor.
 */
export function maxColsForContainer(
    width: number,
    size: 'compact' | 'default' | 'wide' = 'default',
): number {
    if (width <= 0) return 1;

    const minCard =
        size === 'compact' ? 132 : size === 'wide' ? 168 : 148;
    const gap = 10;
    const cols = Math.floor((width + gap) / (minCard + gap));

    return Math.max(1, Math.min(4, cols));
}

/**
 * Reparte tarjetas en filas equilibradas sin huecos ni columnas huérfanas.
 * Prioriza 2 filas en desktop; en móvil permite más filas si hace falta.
 */
export function splitBalancedMetricRows(
    count: number,
    maxCols: number,
): number[] {
    if (count <= 0) return [];
    if (count <= maxCols) return [count];

    const twoRow = bestTwoRowSplit(count, maxCols);
    if (twoRow) return twoRow;

    return bestMultiRowSplit(count, maxCols);
}

function bestTwoRowSplit(count: number, maxCols: number): number[] | null {
    let best: number[] | null = null;
    let bestScore = Infinity;

    for (let first = Math.min(maxCols, count - 1); first >= 1; first--) {
        const second = count - first;
        if (second > maxCols || second <= 0) continue;

        const score =
            Math.abs(first - second) +
            (second === 1 ? 10 : 0) +
            (first === 1 ? 6 : 0);

        if (score < bestScore) {
            bestScore = score;
            best = [first, second];
        }
    }

    if (!best || best[1] === 1) return null;
    return best;
}

function bestMultiRowSplit(count: number, maxCols: number): number[] {
    const minRows = Math.ceil(count / maxCols);
    let bestRows: number[] | null = null;
    let bestScore = Infinity;

    for (let numRows = minRows; numRows <= count; numRows++) {
        const rows = distributeAcrossRows(count, numRows, maxCols);
        if (!rows) continue;

        const last = rows[rows.length - 1];
        if (last === 1 && rows.length > 1) continue;

        const score =
            numRows * 3 +
            Math.max(...rows) - Math.min(...rows) +
            (last === 1 ? 10 : 0);

        if (score < bestScore) {
            bestScore = score;
            bestRows = rows;
        }
    }

    if (bestRows) return bestRows;

    const fallback: number[] = [];
    let remaining = count;
    while (remaining > 0) {
        const take = Math.min(maxCols, remaining);
        fallback.push(take);
        remaining -= take;
    }
    return fallback;
}

function distributeAcrossRows(
    count: number,
    numRows: number,
    maxCols: number,
): number[] | null {
    const base = Math.floor(count / numRows);
    const extra = count % numRows;
    if (base < 1 || base > maxCols) return null;

    const rows = Array<number>(numRows).fill(base);
    for (let i = 0; i < extra; i++) {
        rows[numRows - 1 - i]++;
    }

    if (Math.max(...rows) > maxCols) return null;
    return rows;
}

/** @deprecated Usar maxColsForContainer */
export function maxFirstRowForWidth(width: number): number {
    return maxColsForContainer(width);
}
