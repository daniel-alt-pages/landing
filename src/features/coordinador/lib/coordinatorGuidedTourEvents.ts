export const COORD_GUIDED_TOUR_START_EVENT = 'coord:start-guided-tour';

export function requestCoordinadorGuidedTour() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(COORD_GUIDED_TOUR_START_EVENT));
}
