import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

/**
 * False while the server renders and during the browser's first (hydrating)
 * render, true afterwards. Use it before showing anything that comes from this
 * device only, such as a saved list, so the server HTML and the first browser
 * render match exactly.
 */
export const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);
