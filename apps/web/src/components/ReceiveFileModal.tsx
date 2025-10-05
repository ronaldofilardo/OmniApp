import { useState } from 'react';
import styled from 'styled-components';
import { useMutation } from '@tanstack/react-query';
import { X, Copy, Check } from 'phosphor-react';
import QRCode from 'react-qr-code';
import { useToast } from './useToast';
import { api } from '../services/api';
import { Modal } from './Modal';
import { Button } from './Button';

// Styled Components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
`;

const ContentContainer = styled.div`
  text-align: center;
`;

const InfoText = styled.p`
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const CodeBox = styled.div`
  background-color: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const CodeLabel = styled.p`
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const CodeValue = styled.p`
  font-size: 2.5rem;
  font-weight: bold;
  letter-spacing: 0.5rem;
  color: ${({ theme }) => theme.colors['primary-blue']};
  margin-bottom: 1rem;
  font-family: 'Courier New', Courier, monospace;
`;

const UrlContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f4f4f4;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  word-break: break-all;
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

interface ReceiveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

export function ReceiveFileModal({ isOpen, onClose, eventId }: ReceiveFileModalProps) {
  const toast = useToast();
  const [uploadCode, setUploadCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/generate-upload-code`),
    onSuccess: (response) => {
      setUploadCode(response.data.uploadCode);
    },
    onError: () => {
      toast.show('Erro ao gerar código de envio. Tente novamente.', 'error');
      onClose();
    },
  });

  const handleGenerateCode = () => {
    if (!uploadCode) {
      mutation.mutate();
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Construir a base do frontend dinamicamente para suportar acesso de rede
  const getFrontendBase = () => {
    // Se há variável de ambiente, usar ela
    if (import.meta.env.VITE_FRONTEND_URL) {
      return import.meta.env.VITE_FRONTEND_URL;
    }
    
    // Detectar se estamos usando localhost e forçar IP da rede se necessário
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      
      // Se está usando localhost, substituir pelo IP da rede para funcionar no celular
      if (currentOrigin.includes('localhost')) {
        // IP detectado automaticamente da rede
        return 'http://192.168.15.3:5173';
      }
      
      return currentOrigin;
    }
    
    // Fallback (não deveria acontecer no browser)
    return 'http://192.168.15.3:5173';
  };
  
  const frontendBase = getFrontendBase();
  const uploadUrl = `${frontendBase.replace(/\/$/, '')}/receber/exame/${eventId}`;
  
  console.log('🔗 Frontend Base URL:', frontendBase);
  console.log('📤 Upload URL gerada:', uploadUrl);

  // Reset state when modal is closed
  const handleClose = () => {
    setUploadCode(null);
    mutation.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <ModalTitle>Receber Documentos do Evento</ModalTitle>
        <CloseButton onClick={handleClose}><X size={24} /></CloseButton>
      </ModalHeader>
      <ContentContainer>
        {!uploadCode ? (
          <>
            <InfoText>
              Clique no botão abaixo para gerar um link e um código de uso único.
              Forneça ambos ao remetente (clínica, médico...) para que eles possam enviar o resultado diretamente para sua timeline.
            </InfoText>
            <Button onClick={handleGenerateCode} disabled={mutation.isPending}>
              {mutation.isPending ? 'Gerando...' : 'Gerar Código e Link'}
            </Button>
          </>
        ) : (
          <>
            <InfoText>
              Forneça o link e o código abaixo para o remetente. Eles poderão escolher o tipo de documento a ser enviado. O código é válido por 90 dias e pode ser usado apenas uma vez. 
              <br/><strong>Dica:</strong> Clique no link para testá-lo ou compartilhe o QR Code.
            </InfoText>
            <CodeBox>
              <CodeLabel>Código de Envio</CodeLabel>
              <CodeValue>{uploadCode}</CodeValue>
              <Button onClick={() => copyToClipboard(uploadCode!, 'code')} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                {copiedCode ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar Código</>}
              </Button>
            </CodeBox>
            <CodeLabel>Link para Envio</CodeLabel>
            <UrlContainer>
              <UrlLink href={uploadUrl} target="_blank" rel="noopener noreferrer">
                {uploadUrl}
              </UrlLink>
              <CopyButton onClick={() => copyToClipboard(uploadUrl, 'url')}>
                {copiedUrl ? <Check size={20} /> : <Copy size={20} />}
              </CopyButton>
            </UrlContainer>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem' }}>
              <QRCode value={uploadUrl} size={128} />
              <span style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.5rem' }}>Escaneie para acessar o link de envio</span>
            </div>
          </>
        )}
      </ContentContainer>
    </Modal>
  );
}
