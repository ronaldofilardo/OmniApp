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
    
    // Construir URL de compartilhamento - sempre usar IP da rede local para compatibilidade móvel
    const requestHost = req.get('host');
    const localIp = getLocalIp();
    
    // Forçar uso do IP da rede local se disponível, mesmo que a requisição venha de localhost
    const hostToUse = (localIp !== 'localhost' && !localIp.startsWith('127.')) 
      ? localIp 
      : (requestHost ? requestHost.split(':')[0] : 'localhost');
      
    const frontendPort = process.env.VITE_PORT || process.env.FRONTEND_PORT || '5173';
    const shareUrl = `${req.protocol}://${hostToUse}:${frontendPort}/share/${session.shareToken}`;
    
    logger.info({ shareUrl, hostToUse, requestHost, localIp }, 'URL de compartilhamento gerada');
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
  try {
    const pool = req.app.locals.pool;
    const files = await getSharedFiles(pool, accessToken);

    const filesWithUrls = files.map(file => {
      const filePath = file.file_path.replace(/\\/g, '/');
      const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
      logger.debug({ fileName: file.file_name, fileUrl }, 'URL de arquivo gerada');
      return {
        id: file.id,
        fileName: file.file_name,
        url: fileUrl
      };
    });

    res.status(200).json(filesWithUrls);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar arquivos compartilhados');
    res.status(401).json({ message: 'Token de acesso inválido ou expirado.' });
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