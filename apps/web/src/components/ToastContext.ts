import { createContext } from 'react';

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' };

export const ToastContext = createContext<{ show: (message: string, type?: Toast['type']) => void } | null>(null);
