import { create } from 'zustand';
import { api } from '../services/api';
import type { UserLogin } from 'shared/src/validations';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: UserLogin) => Promise<boolean>;
  logout: () => void;
}

// MODIFICAÇÃO PARA O MVP:
// O estado inicial de 'isAuthenticated' é definido como 'true' para bypassar a tela de login.
// O usuário é mockado com o mesmo ID usado no backend para consistência.
export const useAuthStore = create<AuthState>((set) => ({
  user: { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', email: 'mvp-user@healthtimeline.com' },
  isAuthenticated: true, // <-- MODIFICADO: Sempre autenticado para o MVP
  error: null,
  
  // A lógica de login e logout é mantida para o pós-MVP, mas não será utilizada no fluxo principal do MVP.
  login: async (credentials) => {
    try {
      const response = await api.post('/users/login', credentials);
      if (response.status === 200) {
        set({ user: response.data.user, isAuthenticated: true, error: null });
        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao tentar fazer login.';
      set({ error: errorMessage, isAuthenticated: false, user: null });
      return false;
    }
  },
  logout: () => {
    // No MVP, o logout não altera o estado de autenticação.
    // A lógica será reativada no pós-MVP.
    // set({ user: null, isAuthenticated: false, error: null });
  },
}));
