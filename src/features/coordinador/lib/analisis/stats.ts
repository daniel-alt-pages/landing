export function calcMean(nums: number[]) { return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; }
export function calcMedian(nums: number[]) {
    if (nums.length === 0) return 0;
    const s = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
export function calcMode(nums: number[]) {
    if (nums.length === 0) return 0;
    const freq: Record<number, number> = {};
    nums.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
    let maxF = 0, mode = nums[0];
    Object.entries(freq).forEach(([k, v]) => { if (v > maxF) { maxF = v; mode = Number(k); } });
    return mode;
}
export function calcStdDev(nums: number[]) {
    if (nums.length < 2) return 0;
    const mean = calcMean(nums);
    return Math.sqrt(nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length);
}
export function calcCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0), sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0), sumY2 = y.reduce((a, b) => a + b * b, 0);
    const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}
