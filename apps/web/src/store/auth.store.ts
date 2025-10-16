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
// Sem autenticação JWT - acesso livre
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  
  // Login simplificado sem JWT
  login: async (credentials) => {
    try {
      const response = await api.post('/users/login', credentials);
      if (response.status === 200) {
        // Sem token - apenas marca como autenticado
        set({ user: response.data.user, isAuthenticated: true, error: null });
        return true;
      }
      return false;
    } catch (err: unknown) {
      // extrair mensagem de erro de forma segura
      let errorMessage = 'Erro ao tentar fazer login.';
      try {
        const maybe = err as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = maybe?.response?.data?.message || maybe?.message || errorMessage;
      } catch (e) { console.warn('Error parsing login error', e); }
      set({ error: errorMessage, isAuthenticated: false, user: null });
      return false;
    }
  },
  logout: () => {
    // Logout simplificado
    set({ user: null, isAuthenticated: false, error: null });
  }
}));
