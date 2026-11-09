import { useDispatch, useSelector, useStore } from 'react-redux';
import type { SiteDispatch, SiteState, SiteStore } from './store';

export const useSiteDispatch = useDispatch.withTypes<SiteDispatch>();
export const useSiteSelector = useSelector.withTypes<SiteState>();
export const useSiteStore = useStore.withTypes<SiteStore>();
