import { z } from 'zod';

export const createProfessionalSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  specialty: z.string().min(2, 'Especialidade obrigatória'),
  address: z.string().optional(),
  contact: z.string().optional(),
});
