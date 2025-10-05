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
interface EventFile { id: string; file_name: string; }
const ModalHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; `;
const ModalTitle = styled.h2` font-size: 1.25rem; `;
const CloseButton = styled.button` background: none; border: none; cursor: pointer; padding: 0.25rem; line-height: 1; `;
const StepContainer = styled.div` text-align: center; `;
const FileList = styled.div` text-align: left; margin-bottom: 1.5rem; `;
const CheckboxContainer = styled.div` display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; `;
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
    ? (shareData.shareUrl
        || `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/share/${shareData.shareToken}`)
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
              {files?.map((file: EventFile) => (
                <CheckboxContainer key={file.id}>
                  <input type="checkbox" id={file.id} onChange={() => handleFileSelect(file.id)} />
                  <label htmlFor={file.id}>{file.file_name}</label>
                </CheckboxContainer>
              ))}
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
