/** Clase cuando el tour apunta a este control (hover/click). */
export function showcaseTourHighlightClass(
  elementId: string,
  highlightId: string | null,
  pulse = false,
) {
  if (highlightId !== elementId) return '';
  return pulse
    ? 'showcase-tour-highlight showcase-tour-highlight--click'
    : 'showcase-tour-highlight';
}
