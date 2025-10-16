import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as professionalsService from '../services/professionals.service';
import logger from '../logger';

export const professionalsRouter = Router();

function injectPrisma(req: Request, res: Response, next: any) {
  (req as any).prisma = (req.app as any).locals.prisma;
  next();
}

professionalsRouter.use(injectPrisma);

professionalsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user.id;
    const professionals = await professionalsService.getProfessionals((req as any).prisma, user_id);
    return res.status(200).json(professionals);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar profissionais');
    return res.status(500).json({ message: 'Erro ao buscar profissionais.' });
  }
});

professionalsRouter.post('/check', async (req: Request, res: Response) => {
  const { name, specialty } = req.body;
  if (!name || !specialty) return res.status(400).json({ message: 'Nome e especialidade são obrigatórios.' });
  try {
    const user_id = (req as any).user.id;
    const result = await professionalsService.checkProfessionalExists((req as any).prisma, user_id, name, specialty);
    return res.status(200).json(result);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao verificar profissional');
    return res.status(500).json({ message: 'Erro ao verificar profissional.' });
  }
});

professionalsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user.id;
    const newProfessional = await professionalsService.createProfessional((req as any).prisma, user_id, req.body);
    return res.status(201).json(newProfessional);
  } catch (error) {
    // Trata violação de unicidade (user_id, name, specialty)
    const code = (error as any)?.code;
    if (code === 'P2002') {
      return res.status(409).json({ message: 'Já existe um profissional com este nome e especialidade.' });
    }
    logger.error({ err: error }, 'Erro ao criar profissional');
    return res.status(500).json({ message: 'Erro interno ao criar profissional.' });
  }
});

// Rota específica deve vir ANTES da rota genérica /:id
professionalsRouter.get('/specialties', async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user.id;
    const specialties = await professionalsService.getSpecialties((req as any).prisma, user_id);
    return res.status(200).json(specialties);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar especialidades');
    return res.status(500).json({ message: 'Erro ao buscar especialidades.' });
  }
});

professionalsRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user_id = (req as any).user.id;
    const professional = await professionalsService.getProfessionalById((req as any).prisma, user_id, id);
    return res.status(200).json(professional);
  } catch (error: any) {
    logger.error({ err: error, professionalId: id }, `Erro ao buscar profissional ${id}`);
    return res.status(404).json({ message: error.message });
  }
});

professionalsRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updated = await professionalsService.updateProfessional((req as any).prisma, id, req.body);
    return res.status(200).json(updated);
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao atualizar profissional');
    return res.status(500).json({ message: 'Erro ao atualizar profissional.' });
  }
});

professionalsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user_id = (req as any).user.id;
    const result = await professionalsService.deleteProfessional((req as any).prisma, user_id, id);
    // result will contain info about what happened
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ err: error, professionalId: id }, 'Erro ao deletar profissional');
    return res.status(400).json({ message: error.message || 'Erro ao deletar profissional.' });
  }
});