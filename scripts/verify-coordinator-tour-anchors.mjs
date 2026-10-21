#!/usr/bin/env node
/**
 * Verifica que los anclajes referenciados en pasos del tour existan en el DOM (código fuente).
 * Uso: node scripts/verify-coordinator-tour-anchors.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');

function read(file) {
    return fs.readFileSync(file, 'utf8');
}

function walk(dir, acc = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            if (ent.name === 'node_modules' || ent.name === '.next') continue;
            walk(p, acc);
        } else if (/\.(tsx?|jsx?)$/.test(ent.name)) {
            acc.push(p);
        }
    }
    return acc;
}

const anchorsFile = read(path.join(srcDir, 'features/coordinador/lib/tourAnchors.ts'));
const canonicalIds = [...anchorsFile.matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]);

const stepsFile = read(path.join(srcDir, 'features/coordinador/lib/coordinatorGuidedTourSteps.ts'));
const stepAnchors = [...stepsFile.matchAll(/anchor:\s*TourAnchors\.(\w+)/g)].map((m) => m[1]);

const anchorIdByKey = {};
for (const m of anchorsFile.matchAll(/(\w+):\s*'([^']+)'/g)) {
    anchorIdByKey[m[1]] = m[2];
}

const stepAnchorIds = stepAnchors.map((k) => anchorIdByKey[k]).filter(Boolean);

const sourceFiles = walk(srcDir);
const domAnchors = new Set();
for (const file of sourceFiles) {
    const text = read(file);
    for (const m of text.matchAll(/data-coord-tour=\{TourAnchors\.(\w+)\}/g)) {
        domAnchors.add(anchorIdByKey[m[1]]);
    }
    for (const m of text.matchAll(/data-coord-tour="([^"]+)"/g)) {
        domAnchors.add(m[1]);
    }
    for (const m of text.matchAll(/tourAnchor=\{TourAnchors\.(\w+)\}/g)) {
        domAnchors.add(anchorIdByKey[m[1]]);
    }
    for (const m of text.matchAll(/tourId=\{TourAnchors\.(\w+)\}/g)) {
        domAnchors.add(anchorIdByKey[m[1]]);
    }
}

const skipOptional = new Set([
    anchorIdByKey.helpBubble,
    anchorIdByKey.reportToolbar,
    anchorIdByKey.dashboardInsights,
    anchorIdByKey.studentModalScores,
    anchorIdByKey.studentModalTabs,
    anchorIdByKey.pensumFilters,
    anchorIdByKey.pensumStrengths,
    anchorIdByKey.pensumPlanAccordion,
    anchorIdByKey.pensumBanco,
    anchorIdByKey.desempenoCurricularDonut,
    anchorIdByKey.desempenoCurricularBrechas,
    anchorIdByKey.analisisDrawer,
    anchorIdByKey.fallback,
]);

const missingInDom = [...new Set(stepAnchorIds)].filter(
    (id) => id && !domAnchors.has(id) && !skipOptional.has(id),
);

const orphanDom = [...domAnchors].filter(
    (id) => id && !canonicalIds.includes(id) && !id.includes('${') && !id.includes('<'),
);

let failed = false;

if (missingInDom.length) {
    failed = true;
    console.error('❌ Anclas en pasos sin binding DOM (obligatorias):');
    missingInDom.forEach((id) => console.error(`   - ${id}`));
}

if (orphanDom.length) {
    console.warn('⚠️  data-coord-tour no listados en tourAnchors.ts:');
    orphanDom.forEach((id) => console.warn(`   - ${id}`));
}

if (!failed) {
    console.log(`✅ Tour anchors OK (${stepAnchorIds.length} refs en pasos, ${domAnchors.size} en DOM)`);
}

process.exit(failed ? 1 : 0);
