import multer from 'multer';
import path from 'path';

// Usar memoryStorage para salvar em Base64 no banco
const storage = multer.memoryStorage();

// Validação: aceitar apenas tipos image/* e tamanho máximo de 2KB
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // aceitar qualquer imagem (image/png, image/jpeg, image/gif, etc.)
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Apenas arquivos do tipo imagem são permitidos'));
  }

  cb(null, true);
};

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024, // 2KB máximo
    files: 6 // permitir até 6 arquivos por request (um por slot)
  },
  fileFilter: fileFilter
});