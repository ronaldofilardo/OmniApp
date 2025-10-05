import { z } from 'zod';

// --- SCHEMAS DE USUÁRIO (Inalterados) ---
export const userRegisterSchema = z.object({
  email: z.string().email("Formato de e-mail inválido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
});

export const userLoginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido."),
  password: z.string().nonempty("A senha é obrigatória."),
});

// --- SCHEMAS DE EVENTOS (Refatorados) ---

// Schema base com campos comuns
const baseEventSchema = z.object({
  professional: z.string().nonempty("O nome do profissional é obrigatório."),
  event_date: z.string()
    .nonempty("A data de início é obrigatória.")
    .refine((date) => !isNaN(Date.parse(date)), { message: "A data fornecida não é válida." }),
  start_time: z.string().nonempty("A hora de início é obrigatória."),
  notes: z.string().max(500, "As observações não podem exceder 500 caracteres.").optional(),
});

// Schema para eventos pontuais (Consulta, Exame)
export const createPontualEventSchema = baseEventSchema.extend({
  type: z.enum(["Consulta", "Exame"]),
  end_time: z.string().nonempty("A hora de fim é obrigatória."),
  instructions: z.string().max(50, "As instruções não podem exceder 50 caracteres.").optional(),
}).refine(data => data.end_time > data.start_time, {
    message: "A hora de fim deve ser posterior à hora de início.",
    path: ["end_time"],
});

// --- SCHEMA PARA PROFISSIONAL (Inalterado) ---
export const createProfessionalSchema = z.object({
  name: z.string().nonempty("O nome é obrigatório."),
  specialty: z.string().nonempty("A especialidade é obrigatória."),
  address: z.string().optional(),
  contact: z.string().optional(),
});

// --- EXPORTAÇÃO DE TIPOS ---
export type UserRegister = z.infer<typeof userRegisterSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type CreatePontualEvent = z.infer<typeof createPontualEventSchema>;
export type CreateProfessional = z.infer<typeof createProfessionalSchema>;
