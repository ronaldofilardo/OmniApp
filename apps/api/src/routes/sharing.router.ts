import { Router } from 'express';
import { generateSharingSession, verifySharingSession, getSharedFiles, getSharingSessionsForDebug } from '../services/sharing.service';
import logger from '../logger';
import getLocalIp from '../infra/network';

const router = Router();

// POST /sharing/generate - Gerar nova sessão de compartilhamento
router.post('/generate', async (req, res) => {
  const { fileIds } = req.body;
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: 'Nenhum arquivo selecionado para compartilhamento.' });
  }

  try {
    const pool = req.app.locals.pool;
    const session = await generateSharingSession(pool, fileIds);
    
    // Construir URL de compartilhamento - padronizar para localhost
    const requestHost = req.get('host');
    const localIp = getLocalIp();
    
    // Sempre usar localhost para consistência, exceto se explicitamente em produção
    const hostToUse = process.env.NODE_ENV === 'production' && localIp !== 'localhost' && !localIp.startsWith('127.')
      ? localIp 
      : 'localhost';
      
    const frontendPort = process.env.VITE_PORT || process.env.FRONTEND_PORT || '5173';
    const shareUrl = `${req.protocol}://${hostToUse}:${frontendPort}/share/${session.shareToken}`;
    
    logger.info({ shareUrl, hostToUse, requestHost, localIp, nodeEnv: process.env.NODE_ENV }, 'URL de compartilhamento gerada');
    console.log('🔗 DEBUG: ShareURL gerada:', shareUrl);
    res.status(201).json({ ...session, shareUrl });
  } catch (error) {
    logger.error({ err: error }, 'Erro ao gerar link de compartilhamento');
    res.status(500).json({ message: 'Erro ao gerar link de compartilhamento.' });
  }
});

// POST /sharing/verify - Verificar código de acesso e gerar token
router.post('/verify', async (req, res) => {
  const { shareToken, accessCode } = req.body;
  try {
    logger.debug('--- [DEBUG] /sharing/verify ---');
    logger.debug({ shareToken, accessCode: accessCode ? 'REDACTED' : undefined }, 'sharing.verify inputs');

    const pool = req.app.locals.pool;
    const accessToken = await verifySharingSession(pool, shareToken, accessCode);

    logger.info('Acesso concedido para sessão de compartilhamento');
    res.status(200).json({ accessToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao verificar código de acesso.';
    logger.error({ err: error }, message);

    if (message.includes('inválida ou expirada')) {
      logger.warn({ shareToken }, 'Sessão não encontrada ou expirada para token');
      return res.status(404).json({ message });
    } else if (message.includes('incorreto')) {
      logger.warn({ shareToken }, 'Código de acesso incorreto para token');
      return res.status(401).json({ message });
    } else {
      return res.status(500).json({ message, error: message });
    }
  }
});

// GET /sharing/files/:accessToken - Obter arquivos compartilhados
router.get('/files/:accessToken', async (req, res) => {
  const { accessToken } = req.params;
  console.log('🔍 DEBUG: Buscando arquivos com accessToken:', accessToken.substring(0, 20) + '...');
  try {
    const pool = req.app.locals.pool;
    const files = await getSharedFiles(pool, accessToken);
    console.log('📁 DEBUG: Arquivos encontrados:', files.length);

    // Para melhorar compatibilidade, retornar URL HTTP de streaming
    const host = req.get('host');
    const protocol = req.protocol;
    const filesWithUrls = files.map((file: any) => {
      const url = `${protocol}://${host}/sharing/file/${accessToken}/${file.id}`;
      return { id: file.id, fileName: file.file_name, url };
    });

    console.log('✅ DEBUG: Enviando resposta com', filesWithUrls.length, 'arquivos');
    res.status(200).json(filesWithUrls);
  } catch (error: any) {
    console.log('❌ DEBUG: Erro ao buscar arquivos:', error?.message || error);
    logger.error({ err: error }, 'Erro ao buscar arquivos compartilhados');
    res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
  }
});

// GET /sharing/file/:accessToken/:fileId - Stream do conteúdo do arquivo
router.get('/file/:accessToken/:fileId', async (req, res) => {
  const { accessToken, fileId } = req.params as { accessToken: string; fileId: string };
  try {
    const pool = req.app.locals.pool;
    // Reusar verificação do token via getSharedFiles (lança se inválido)
    const files = await getSharedFiles(pool, accessToken);
    const allowed = files.find((f: any) => String(f.id) === String(fileId));
    if (!allowed) {
      return res.status(404).json({ message: 'Arquivo não autorizado para esta sessão.' });
    }

    // Buscar o arquivo específico para obter conteúdo/mime atualizados
    const result = await pool.query(
      'SELECT file_name, mime_type, file_content FROM event_files WHERE id = $1',
      [fileId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Arquivo não encontrado.' });
    }
    const row = result.rows[0];
    if (!row.file_content) {
      return res.status(404).json({ message: 'Arquivo sem conteúdo.' });
    }

    const mime = row.mime_type || 'application/octet-stream';
    const buffer = Buffer.from(row.file_content, 'base64');

    // Content-Disposition com filename ASCII e UTF-8 (RFC 5987)
    const originalName: string = row.file_name || 'arquivo';
    const asciiName = originalName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');
    const encodedName = encodeURIComponent(originalName);
    const isInline = String(mime).startsWith('image/') || String(mime) === 'application/pdf';
    const dispositionType = isInline ? 'inline' : 'attachment';

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${asciiName || 'arquivo'}"; filename*=UTF-8''${encodedName}`);
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.log('❌ DEBUG: Erro ao servir arquivo compartilhado:', error?.message || error);
    return res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
  }
});

// GET /debug/sharing-sessions - Endpoint de debug (apenas para uso local)
router.get('/debug/sharing-sessions', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const sessions = await getSharingSessionsForDebug(pool);
    return res.status(200).json(sessions);
  } catch (error) {
    logger.error({ err: error }, 'Erro no debug/sharing-sessions');
    return res.status(500).json({ message: 'Erro ao listar sessions de compartilhamento.' });
  }
});

export default router;