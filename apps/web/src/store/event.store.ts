import { create } from 'zustand';
import { QueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { CreatePontualEvent } from 'shared/src/validations';

// Este tipo é usado em vários lugares, então precisa ser atualizado.
export interface Event {
  id: string;
  user_id: string;
  type: string;
  professional: string;
  professional_specialty?: string; // <-- NOVO CAMPO
  event_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  has_result?: boolean;
  has_unviewed_result?: boolean;
  // Campos adicionais fornecidos pelo endpoint /events/by-period
  instructions?: string | null;
  professional_address?: string | null;
  professional_contact?: string | null;
}

interface EventState {
  error: string | null;
  isCreating: boolean;
  queryClient?: QueryClient;
  createEvent: (eventData: CreatePontualEvent) => Promise<boolean>;
}

export const useEventStore = create<EventState>((set, get) => ({
  error: null,
  isCreating: false,
  queryClient: undefined,
  createEvent: async (eventData) => {
    set({ isCreating: true, error: null });
    try {
      const response = await api.post('/events', eventData);
      if (response.status === 201) {
        const { queryClient } = get();
        if (queryClient) {
          await queryClient.invalidateQueries({ queryKey: ['events'] });
        }
        set({ isCreating: false });
        return true;
      }
      return false;
    } catch (err: unknown) {
      let errorMessage = 'Erro ao criar evento.';
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyErr = err as any;
        errorMessage = anyErr?.response?.data?.message || anyErr?.message || errorMessage;
      } catch {
        // swallow
      }
      set({ error: errorMessage, isCreating: false });
      return false;
    }
  },
}));
