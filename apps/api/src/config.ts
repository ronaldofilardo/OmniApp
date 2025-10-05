import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_DATABASE: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  TRAVEL_GAP_ENABLED: z.string().optional(),
  TRAVEL_GAP_MINUTES: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // apenas logamos — não interrompemos o processo para não quebrar dev flow
  // consumidor pode optar por falhar em produção
  // eslint-disable-next-line no-console
  console.warn('Aviso: variáveis de ambiente inválidas ou faltando', parsed.error.format());
}

export const config = {
  env: parsed.success ? parsed.data.NODE_ENV || 'development' : process.env.NODE_ENV || 'development',
  port: Number(parsed.success ? parsed.data.PORT || process.env.PORT || 3333 : process.env.PORT || 3333),
  db: {
    host: parsed.success ? parsed.data.DB_HOST || process.env.DB_HOST : process.env.DB_HOST,
    port: parsed.success ? Number(parsed.data.DB_PORT || process.env.DB_PORT || 5432) : Number(process.env.DB_PORT || 5432),
    user: parsed.success ? parsed.data.DB_USER || process.env.DB_USER : process.env.DB_USER,
    password: parsed.success ? parsed.data.DB_PASSWORD || process.env.DB_PASSWORD : process.env.DB_PASSWORD,
    database: parsed.success ? parsed.data.DB_DATABASE || process.env.DB_DATABASE : process.env.DB_DATABASE,
  },
  jwtSecret: parsed.success ? parsed.data.JWT_SECRET || process.env.JWT_SECRET : process.env.JWT_SECRET || 'fallback-secret-for-sharing',
  travelGap: {
    enabled: (parsed.success ? parsed.data.TRAVEL_GAP_ENABLED : process.env.TRAVEL_GAP_ENABLED) === 'false' ? false : true,
    minutes: Number(parsed.success ? parsed.data.TRAVEL_GAP_MINUTES || process.env.TRAVEL_GAP_MINUTES || 60 : process.env.TRAVEL_GAP_MINUTES || 60),
  }
};

export default config;
