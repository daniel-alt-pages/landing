import {
    Chart,
    type ChartConfiguration,
    type ChartType,
    registerables,
} from 'chart.js';

Chart.register(...registerables);

export interface ChartImage {
    base64: string;
    width: number;
    height: number;
}

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

async function renderChart(config: ChartConfiguration, width = 640, height = 380): Promise<ChartImage> {
    if (typeof document === 'undefined') {
        return { base64: '', width: 0, height: 0 };
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { base64: '', width: 0, height: 0 };

    const chart = new Chart(ctx, {
        ...config,
        options: {
            ...config.options,
            animation: false,
            responsive: false,
            maintainAspectRatio: false,
        },
    });

    await new Promise(r => requestAnimationFrame(r));
    const base64 = canvas.toDataURL('image/png').split(',')[1] || '';
    chart.destroy();
    return { base64, width, height };
}

function baseOptions(title: string) {
    return {
        plugins: {
            legend: { display: true, position: 'bottom' as const },
            title: { display: true, text: title, font: { size: 14, weight: 'bold' as const } },
        },
    };
}

export async function chartNiveles(
    data: { label: string; count: number }[],
    title: string
): Promise<ChartImage | null> {
    if (!data.length || data.every(d => d.count === 0)) return null;
    return renderChart({
        type: 'doughnut' as ChartType,
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    data: data.map(d => d.count),
                    backgroundColor: COLORS,
                    borderWidth: 1,
                },
            ],
        },
        options: baseOptions(title),
    });
}

export async function chartBarras(
    data: { label: string; value: number }[],
    title: string,
    horizontal = false
): Promise<ChartImage | null> {
    if (!data.length) return null;
    const type = horizontal ? 'bar' : 'bar';
    return renderChart(
        {
            type: type as ChartType,
            data: {
                labels: data.map(d => d.label),
                datasets: [
                    {
                        label: title,
                        data: data.map(d => d.value),
                        backgroundColor: COLORS[0],
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                ...baseOptions(title),
                indexAxis: horizontal ? 'y' : 'x',
                scales: {
                    x: { beginAtZero: true, grid: { color: '#E5E7EB' } },
                    y: { beginAtZero: true, grid: { color: '#E5E7EB' } },
                },
            },
        },
        horizontal ? 720 : 640,
        horizontal ? 420 : 380
    );
}

export async function chartDistribucion(
    data: { label: string; count: number }[],
    title: string
): Promise<ChartImage | null> {
    if (!data.some(d => d.count > 0)) return null;
    return renderChart({
        type: 'bar' as ChartType,
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Estudiantes',
                    data: data.map(d => d.count),
                    backgroundColor: '#6366F1',
                },
            ],
        },
        options: {
            ...baseOptions(title),
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Estudiantes' } },
            },
        },
    });
}

export async function chartRadarAreas(
    data: { label: string; value: number }[],
    title: string
): Promise<ChartImage | null> {
    if (!data.length) return null;
    return renderChart({
        type: 'radar' as ChartType,
        data: {
            labels: data.map(d => d.label),
            datasets: [
                {
                    label: 'Promedio área (0-100)',
                    data: data.map(d => d.value),
                    backgroundColor: 'rgba(79, 70, 229, 0.25)',
                    borderColor: '#4F46E5',
                    pointBackgroundColor: '#4F46E5',
                },
            ],
        },
        options: {
            ...baseOptions(title),
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 20 },
                },
            },
        },
    });
}

export async function chartInstVsNacional(
    labels: string[],
    instValues: number[],
    natValues: number[],
    title: string
): Promise<ChartImage | null> {
    if (!labels.length) return null;
    return renderChart(
        {
            type: 'bar' as ChartType,
            data: {
                labels,
                datasets: [
                    {
                        label: 'Institución',
                        data: instValues,
                        backgroundColor: '#4F46E5',
                    },
                    {
                        label: 'Referente nacional ICFES',
                        data: natValues,
                        backgroundColor: '#94A3B8',
                    },
                ],
            },
            options: {
                ...baseOptions(title),
                scales: { y: { beginAtZero: true, max: 100 } },
            },
        },
        700,
        400
    );
}
