import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AdminDispatch, AdminState, AdminStore } from './store';

export const useAdminDispatch = useDispatch.withTypes<AdminDispatch>();
export const useAdminSelector = useSelector.withTypes<AdminState>();
export const useAdminStore = useStore.withTypes<AdminStore>();
