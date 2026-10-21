import { describe, expect, it } from 'vitest';
import {
    getGuidedTourStepsForPath,
    resolveStepAnchor,
} from '@features/coordinador/lib/coordinatorGuidedTourSteps';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { routeKeyFromPathname } from '@features/coordinador/lib/coordinatorGuidedTourStorage';

describe('coordinatorGuidedTourSteps', () => {
    it('resuelve routeKey desde pathname', () => {
        expect(routeKeyFromPathname('/coordinador')).toBe('dashboard');
        expect(routeKeyFromPathname('/coordinador/desempeno')).toBe('desempeno');
        expect(routeKeyFromPathname('/demo/coordinador/pensum')).toBe('pensum');
    });

    it('incluye pasos shell en dashboard', () => {
        const steps = getGuidedTourStepsForPath('/coordinador');
        expect(steps.some((s) => s.id === 'nav-sidebar')).toBe(true);
        expect(steps.some((s) => s.id === 'shell-help-bubble')).toBe(true);
        expect(steps.some((s) => s.id === 'd-student-followup')).toBe(true);
    });

    it('resolveStepAnchor usa resolveAnchor cuando existe', () => {
        const step = getGuidedTourStepsForPath('/coordinador').find((s) => s.id === 'nav-sidebar');
        expect(step).toBeDefined();
        const anchor = resolveStepAnchor(step!);
        expect([TourAnchors.navSidebar, TourAnchors.navMobile]).toContain(anchor);
    });

    it('pensum incluye sub-bloques curriculares', () => {
        const steps = getGuidedTourStepsForPath('/coordinador/pensum');
        expect(steps.some((s) => s.id === 'r-filters')).toBe(true);
        expect(steps.some((s) => s.id === 'r-banco')).toBe(true);
    });

    it('benchmark usa anclajes finos para gauge y tarjetas por materia', () => {
        const steps = getGuidedTourStepsForPath('/coordinador');
        const hero = steps.find((s) => s.id === 'd-benchmark-hero');
        const areas = steps.find((s) => s.id === 'd-benchmark-areas');
        expect(hero?.anchor).toBe(TourAnchors.dashboardBenchmarkGauge);
        expect(areas?.anchor).toBe(TourAnchors.dashboardBenchmarkAreaCards);
    });

    it('no incluye pasos dentro de modales ni drawer forzado', () => {
        const routes = [
            '/coordinador',
            '/coordinador/desempeno',
            '/coordinador/pensum',
            '/coordinador/estudiantes',
            '/coordinador/analisis',
            '/coordinador/comparativa',
            '/coordinador/historico',
        ];
        const modalStepIds = ['d-student-open', 'd-student-modal-header', 'd-student-modal-scores', 'd-student-modal-tabs', 'a-drawer'];
        for (const path of routes) {
            const ids = getGuidedTourStepsForPath(path).map((s) => s.id);
            for (const banned of modalStepIds) {
                expect(ids).not.toContain(banned);
            }
        }
    });

    it('no define pasos action que abran overlays', () => {
        const routes = [
            '/coordinador',
            '/coordinador/desempeno',
            '/coordinador/pensum',
            '/coordinador/estudiantes',
            '/coordinador/analisis',
            '/coordinador/comparativa',
            '/coordinador/historico',
        ];
        for (const path of routes) {
            const actionSteps = getGuidedTourStepsForPath(path).filter((s) => s.mode === 'action');
            expect(actionSteps).toHaveLength(0);
        }
    });
});
