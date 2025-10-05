import multer from 'multer';
import path from 'path';

// Usar memoryStorage para salvar em Base64 no banco
const storage = multer.memoryStorage();

// Validação para APENAS JPG de até 6KB
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Verificar MIME type
  if (file.mimetype !== 'image/jpeg') {
    return cb(new Error('Apenas arquivos JPG são permitidos'));
  }
  
  // Verificar extensão do arquivo
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg') {
    return cb(new Error('Apenas arquivos com extensão .jpg ou .jpeg são permitidos'));
  }
  
  cb(null, true);
};

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 6 * 1024, // 6KB máximo
    files: 1 // apenas 1 arquivo por request
  },
  fileFilter: fileFilter
});