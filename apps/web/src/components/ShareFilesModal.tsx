import { useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation } from '@tanstack/react-query';
import QRCode from 'react-qr-code';
import { X, Copy, Check } from 'phosphor-react';
import { useToast } from './useToast';
import { api } from '../services/api';
import { Modal } from './Modal';
import { Button } from './Button';

// ... (Tipagem e Styled Components)
interface EventFile { 
  id: string; 
  file_name: string;
  file_type: string;
}

// Mapeamento dos tipos de arquivo do backend para labels amigáveis
const FILE_TYPE_LABELS: Record<string, string> = {
  'Requisicao': 'Requisição',
  'Autorizacao': 'Autorização',
  'Atestado': 'Atestado',
  'Prescricao': 'Prescrição',
  'LaudoResultado': 'Laudo/Resultado',
  'NotaFiscal': 'Nota Fiscal',
};

// Função para obter o label correto baseado no file_type
const getFileTypeLabel = (file: EventFile): string => {
  // Usar o file_type se disponível
  if (file.file_type && FILE_TYPE_LABELS[file.file_type]) {
    return FILE_TYPE_LABELS[file.file_type];
  }
  
  // Fallback: tentar identificar pelo nome do arquivo
  const nameLower = file.file_name.toLowerCase();
  
  if (nameLower.includes('requisicao') || nameLower.includes('requisição')) {
    return 'Requisição';
  }
  if (nameLower.includes('autorizacao') || nameLower.includes('autorização')) {
    return 'Autorização';  
  }
  if (nameLower.includes('atestado')) {
    return 'Atestado';
  }
  if (nameLower.includes('prescricao') || nameLower.includes('prescrição')) {
    return 'Prescrição';
  }
  if (nameLower.includes('laudo') || nameLower.includes('resultado')) {
    return 'Laudo/Resultado';
  }
  if (nameLower.includes('nota') && nameLower.includes('fiscal')) {
    return 'Nota Fiscal';
  }
  
  // Fallback por extensão
  if (nameLower.endsWith('.pdf')) {
    return 'Documento PDF';
  }
  if (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.png')) {
    return 'Imagem';
  }
  if (nameLower.endsWith('.doc') || nameLower.endsWith('.docx')) {
    return 'Documento Word';
  }
  if (nameLower.endsWith('.txt')) {
    return 'Arquivo de Texto';
  }
  if (nameLower.endsWith('.mp4') || nameLower.endsWith('.avi')) {
    return 'Vídeo';
  }
  
  return 'Documento';
};

// Função para definir cores por tipo de documento (igual ao EventCard)
const getFileTypeColor = (fileType: string): string => {
  switch (fileType) {
    case 'Requisição': return '#28a745'; // Verde
    case 'Autorização': return '#17a2b8'; // Azul claro
    case 'Atestado': return '#28a745'; // Verde
    case 'Prescrição': return '#6f42c1'; // Roxo
    case 'Laudo/Resultado': return '#dc3545'; // Vermelho
    case 'Nota Fiscal': return '#ffc107'; // Amarelo
    case 'Documento PDF': return '#dc3545'; // Vermelho
    case 'Imagem': return '#17a2b8'; // Azul
    case 'Documento Word': return '#007bff'; // Azul escuro
    case 'Arquivo de Texto': return '#6c757d'; // Cinza
    case 'Vídeo': return '#e83e8c'; // Rosa
    default: return '#6c757d'; // Cinza padrão
  }
};

// Função para obter ícone/letra do tipo de documento
const getFileTypeIcon = (fileType: string): string => {
  switch (fileType) {
    case 'Requisição': return 'R';
    case 'Autorização': return 'A';
    case 'Atestado': return 'At';
    case 'Prescrição': return 'P';
    case 'Laudo/Resultado': return 'L';
    case 'Nota Fiscal': return 'NF';
    case 'Documento PDF': return 'PDF';
    case 'Imagem': return 'IMG';
    case 'Documento Word': return 'DOC';
    case 'Arquivo de Texto': return 'TXT';
    case 'Vídeo': return 'VID';
    default: return 'DOC';
  }
};
const ModalHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; `;
const ModalTitle = styled.h2` font-size: 1.25rem; `;
const CloseButton = styled.button` background: none; border: none; cursor: pointer; padding: 0.25rem; line-height: 1; `;
const StepContainer = styled.div` text-align: center; `;
const FileList = styled.div` 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  text-align: left; 
  margin-bottom: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
`;

const FileCard = styled.div<{ isSelected: boolean; fileType: string }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid ${props => props.isSelected ? getFileTypeColor(props.fileType) : '#e0e0e0'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.isSelected ? `${getFileTypeColor(props.fileType)}15` : 'white'};
  box-shadow: ${props => props.isSelected ? `0 2px 8px ${getFileTypeColor(props.fileType)}30` : '0 1px 3px rgba(0,0,0,0.1)'};
  
  &:hover {
    border-color: ${props => getFileTypeColor(props.fileType)};
    background: ${props => `${getFileTypeColor(props.fileType)}10`};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const FileIcon = styled.div<{ fileType: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: ${props => getFileTypeColor(props.fileType)};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
`;

const FileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FileTypeName = styled.span`
  font-weight: 500;
  font-size: 0.95rem;
  color: #333;
`;

const FileName = styled.span`
  font-size: 0.8rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;


const QRContainer = styled.div` background: white; padding: 1rem; display: inline-block; margin: 1rem 0; `;
const AccessCode = styled.p` font-size: 2rem; font-weight: bold; letter-spacing: 0.5rem; margin: 1rem 0; `;

const UrlContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f4f4f4;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  word-break: break-all;
  margin: 1rem 0;
`;

const UrlLink = styled.a`
  color: #007bff;
  text-decoration: none;
  word-break: break-all;
  flex: 1;
  
  &:hover {
    color: #0056b3;
    text-decoration: underline;
  }
  
  &:visited {
    color: #6f42c1;
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  color: #555;
  &:hover {
    color: #000;
  }
`;

const UrlLabel = styled.p`
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.5rem;
  text-align: left;
`;

interface ShareFilesModalProps { isOpen: boolean; onClose: () => void; eventId: string; }

export function ShareFilesModal({ isOpen, onClose, eventId }: ShareFilesModalProps) {
  const [step, setStep] = useState(1);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [shareData, setShareData] = useState<{ shareToken: string; accessCode: string; shareUrl?: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { data: files, isLoading } = useQuery({
    queryKey: ['files', eventId],
    queryFn: () => api.get(`/events/${eventId}/files`).then(res => res.data),
    enabled: isOpen,
  });

  const toast = useToast();

  const copyToClipboard = (text: string, type: 'url' | 'code') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
      toast.show(`${type === 'url' ? 'Link' : 'Código'} copiado!`, 'success');
    });
  };

  const generateMutation = useMutation({
    mutationFn: (fileIds: string[]) => api.post('/sharing/generate', { fileIds }),
    onSuccess: (response) => {
      setShareData(response.data);
      setStep(2);
    },
    onError: () => toast.show('Erro ao gerar link de compartilhamento.', 'error'),
  });

  const handleFileSelect = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleGenerateClick = () => {
    if (selectedFileIds.length === 0) {
      toast.show('Selecione pelo menos um arquivo para compartilhar.', 'error');
      return;
    }
    generateMutation.mutate(selectedFileIds);
  };

  const resetState = () => {
    setStep(1);
    setSelectedFileIds([]);
    setShareData(null);
    setCopiedUrl(false);
    setCopiedCode(false);
    onClose();
  };

  const shareUrl = shareData
    ? (shareData.shareUrl || (() => {
        // Garantir que use localhost em vez de IP
        const hostname = window.location.hostname === '192.168.15.2' || 
                        window.location.hostname === '192.168.15.3' ? 
                        'localhost' : window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        return `${window.location.protocol}//${hostname}${port}/share/${shareData.shareToken}`;
      })())
    : '';

  return (
    <Modal isOpen={isOpen} onClose={resetState}>
      <ModalHeader>
        <ModalTitle>{step === 1 ? 'Selecionar Arquivos para Compartilhar' : 'Compartilhamento Seguro'}</ModalTitle>
        <CloseButton onClick={resetState}><X size={24} /></CloseButton>
      </ModalHeader>

      {step === 1 && (
        <StepContainer>
          {isLoading ? <p>Carregando arquivos...</p> : (
            <FileList>
              {files?.map((file: EventFile) => {
                const fileType = getFileTypeLabel(file);
                const isSelected = selectedFileIds.includes(file.id);
                const shortFileName = file.file_name.length > 35 
                  ? `${file.file_name.substring(0, 35)}...`
                  : file.file_name;
                
                return (
                  <FileCard 
                    key={file.id}
                    isSelected={isSelected}
                    fileType={fileType}
                    onClick={() => handleFileSelect(file.id)}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleFileSelect(file.id)}
                      style={{ margin: 0 }}
                    />
                    <FileIcon fileType={fileType}>
                      {getFileTypeIcon(fileType)}
                    </FileIcon>
                    <FileInfo>
                      <FileTypeName>{fileType}</FileTypeName>
                      <FileName>{shortFileName}</FileName>
                    </FileInfo>
                  </FileCard>
                );
              })}
            </FileList>
          )}
          <Button onClick={handleGenerateClick} disabled={isLoading || generateMutation.isPending}>
            {generateMutation.isPending ? 'Gerando...' : 'Gerar Link de Compartilhamento'}
          </Button>
        </StepContainer>
      )}

      {step === 2 && shareData && (
        <StepContainer>
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Compartilhe o link e código de acesso com o profissional. Eles poderão visualizar os documentos selecionados.
            <br/><strong>Dica:</strong> Clique no link para testá-lo ou compartilhe o QR Code.
          </p>
          
          <UrlLabel>Link de Compartilhamento</UrlLabel>
          <UrlContainer>
            <UrlLink href={shareUrl} target="_blank" rel="noopener noreferrer">
              {shareUrl}
            </UrlLink>
            <CopyButton onClick={() => copyToClipboard(shareUrl, 'url')}>
              {copiedUrl ? <Check size={20} /> : <Copy size={20} />}
            </CopyButton>
          </UrlContainer>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem 0' }}>
            <QRContainer>
              <QRCode value={shareUrl} size={128} />
            </QRContainer>
            <span style={{ fontSize: '0.9rem', color: '#555' }}>Escaneie para acessar o compartilhamento</span>
          </div>
          
          <UrlLabel>Código de Acesso</UrlLabel>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <AccessCode>{shareData.accessCode}</AccessCode>
            <CopyButton onClick={() => copyToClipboard(shareData.accessCode, 'code')} style={{ fontSize: '1.2rem' }}>
              {copiedCode ? <Check size={24} /> : <Copy size={24} />}
            </CopyButton>
          </div>
          
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Este acesso expira em 30 minutos.</p>
        </StepContainer>
      )}
    </Modal>
  );
}
