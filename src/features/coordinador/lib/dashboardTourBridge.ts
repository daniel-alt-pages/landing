/** Callback registrado por CoordinadorDashboardView para cambiar tab durante el tour. */
let setDashboardTabFn: ((tabId: string) => void) | null = null;

export function registerDashboardTabSetter(fn: (tabId: string) => void): () => void {
    setDashboardTabFn = fn;
    return () => {
        if (setDashboardTabFn === fn) setDashboardTabFn = null;
    };
}

export function switchDashboardTab(tabId: string) {
    setDashboardTabFn?.(tabId);
}
