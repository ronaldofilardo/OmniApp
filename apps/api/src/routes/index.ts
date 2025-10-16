import { Router, Request, Response } from 'express';
import { eventsRouter } from './events.router';
import { filesRouter } from './files.router';
import * as eventsService from '../services/events.service';
import * as filesService from '../services/files.service';
import { prisma } from '../infra/db/prisma';
import { professionalsRouter } from './professionals.router';
import sharingRouter from './sharing.router';
import repositoryRouter from './repository.router';
import debugRouter from './debug.router';
import usersRouter from './users.router';
import { notificationsRouter } from './notifications.router';
import { externalRouter } from './external.router';

export const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
	return res.status(200).json({ 
		status: 'ok', 
		timestamp: new Date().toISOString(),
		service: 'Omni Saúde API',
		version: '1.0.0'
	});
});

// Status endpoint (alias for health)
router.get('/status', (req: Request, res: Response) => {
	return res.status(200).json({ 
		status: 'running', 
		timestamp: new Date().toISOString()
	});
});

// Root endpoint
router.get('/', (req: Request, res: Response) => {
	return res.status(200).json({ 
		message: 'Omni Saúde API is running',
		version: '1.0.0',
		endpoints: ['/health', '/status', '/timeline']
	});
});

// Rotas de compatibilidade (legacy) usadas pelo frontend antigo
// GET /timeline -> delega para /events/timeline
router.get('/timeline', async (req: Request, res: Response) => {
	const { startDate, endDate } = req.query;
	if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
		return res.status(400).json({ message: 'Os parâmetros startDate e endDate são obrigatórios.' });
	}
	try {
		const userId = (req as any)?.user?.id;
		const items = await eventsService.getTimeline((req as any).app.locals.pool, (req as any).app.locals.prisma, startDate, endDate, userId);
		return res.status(200).json(items);
	} catch (error) {
		return res.status(500).json({ message: 'Erro interno ao buscar a timeline.' });
	}
});

// GET /events/:id/files -> delega para o serviço de arquivos (endpoint legacy esperado)
router.get('/events/:eventId/files', async (req: Request, res: Response) => {
	const { eventId } = req.params;
	const prisma = (req.app as any).locals.prisma;
	try {
		const files = await filesService.getFilesForEvent(prisma, eventId);
		return res.status(200).json(files);
	} catch (error) {
		return res.status(500).json({ message: 'Erro ao buscar arquivos.' });
	}
});

// POST /events/:eventId/files (compat - aceita upload público via formulário)
import { upload } from '../infra/storage/uploads';
router.post('/events/:eventId/files', upload.single('file'), async (req: Request, res: Response) => {
	const { eventId } = req.params;
	const { file_type, upload_code } = req.body;
	const file = (req as any).file;
	const prisma = (req.app as any).locals.prisma; // Usar o prisma do app.locals
	if (!file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
	if (!file_type) {
		return res.status(400).json({ message: 'O tipo do arquivo é obrigatório.' });
	}

	if (upload_code) {
		try {
			const pool = (req.app as any).locals.pool;
			const result = await pool.query('SELECT upload_code_hash, upload_code_expires_at, upload_code_status FROM events WHERE id = $1 AND user_id = $2', [eventId, 'a1b2c3d4-e5f6-7890-1234-567890abcdef']);
			if (result.rows.length === 0) {
				console.info(`[upload-diagnostics] compat event=${eventId} - not found`);
				return res.status(404).json({ message: 'Evento não encontrado.' });
			}
			const row = result.rows[0];
			console.info(`[upload-diagnostics] compat event=${eventId} status=${row.upload_code_status} expires_at=${row.upload_code_expires_at}`);
			if (row.upload_code_status !== 'active' || !row.upload_code_hash || !row.upload_code_expires_at || new Date(row.upload_code_expires_at) < new Date()) {
				console.info(`[upload-diagnostics] compat event=${eventId} - code invalid/expired`);
				return res.status(401).json({ message: 'Código de envio inválido ou expirado.' });
			}
			const bcrypt = require('bcryptjs');
			const match = await bcrypt.compare(String(upload_code), row.upload_code_hash);
			if (!match) {
				console.info(`[upload-diagnostics] compat event=${eventId} - code mismatch`);
				return res.status(401).json({ message: 'Código de envio incorreto.' });
			}
			// Código válido: apenas prosseguir; marcaremos como 'used' APÓS persistir o arquivo com sucesso
		} catch (err) {
			console.error('Erro ao validar código de upload (compat)', err);
			return res.status(500).json({ message: 'Erro ao validar código de envio.' });
		}
	}

	try {
		console.info(`[upload-diagnostics] compat event=${eventId} - iniciando persistência de arquivo name=${file.originalname} size=${file.size}`);
		
		// Buscar o evento para pegar o user_id correto
		const event = await prisma.events.findUnique({
			where: { id: eventId },
			select: { user_id: true }
		});

		if (!event) {
			return res.status(404).json({ message: 'Evento não encontrado.' });
		}

		// Verifica se já existe um arquivo deste tipo para este evento
		const existingFile = await prisma.event_files.findFirst({
			where: {
				event_id: eventId,
				file_type: file_type
			}
		});

		let newFile;
		// Converter arquivo para Base64
		const fileContent = file.buffer.toString('base64');

		if (existingFile) {
			// Atualiza o arquivo existente
			console.info(`[upload-diagnostics] compat event=${eventId} - atualizando arquivo existente id=${existingFile.id}`);
			
			newFile = await prisma.event_files.update({
				where: { id: existingFile.id },
				data: {
					file_name: file.originalname || 'arquivo',
					file_content: fileContent,
					file_path: null,
					mime_type: file.mimetype || '',
					uploaded_at: new Date(),
					viewed_at: null, // Reset viewed status
				}
			});
		} else {
			// Cria novo arquivo usando o user_id do evento
			newFile = await prisma.event_files.create({
				data: {
					event_id: eventId,
					file_name: file.originalname || 'arquivo',
					file_type: file_type,
					mime_type: file.mimetype || '',
					file_content: fileContent,
					file_path: null,
					user_id: event.user_id, // Usar o user_id do evento
					uploaded_at: new Date()
				}
			});
		}

		// Se veio upload_code, marcar como usado agora que persistimos com sucesso
		if (upload_code) {
			try {
				const pool = (req.app as any).locals.pool;
				await pool.query('UPDATE events SET upload_code_status = $1 WHERE id = $2', ['used', eventId]);
			} catch (e) {
				console.error('Erro ao marcar código de envio como usado após upload', e);
			}
		}
		return res.status(201).json(newFile);
	} catch (error) {
		console.error('Erro ao salvar arquivo (compat route)', error);
		return res.status(500).json({ message: 'Erro ao salvar arquivo.' });
	}
});

router.use('/events', eventsRouter);
router.use('/files', filesRouter);
router.use('/professionals', professionalsRouter);
// router.use('/backup', backupRouter); // DESABILITADO PARA VERCEL DEPLOY - estava sem import
router.use('/sharing', sharingRouter);
router.use('/repository', repositoryRouter);
router.use('/debug', debugRouter);
router.use('/users', usersRouter);
router.use('/notifications', notificationsRouter);
router.use('/external', externalRouter);

// TODO: montar outros sub-routers aqui