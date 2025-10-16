import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'phosphor-react';
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

const CodeDisplay = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  text-align: center;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 1.5rem;
  font-weight: bold;
  color: #495057;
`;

const Instructions = styled.p`
  color: #6c757d;
  margin-bottom: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
`;

interface ReceiveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  fileType?: string;
  fileLabel?: string;
}

export function ReceiveFileModal({ isOpen, onClose, eventId, fileType = 'Documento', fileLabel = 'Documento' }: ReceiveFileModalProps) {
  const [code, setCode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // When the modal opens, try to fetch an existing active upload code for this event/fileType
    if (!isOpen) return;
    const fetchExisting = async () => {
      try {
        const resp = await api.get(`/events/${eventId}/upload-code`, { params: { fileType } });
        if (resp.data && resp.data.uploadCode) {
          setCode(resp.data.uploadCode);
        }
      } catch {
        // ignore 404 / no code cases
      }
    };
    fetchExisting();
  }, [isOpen, eventId, fileType]);

  const generateCodeMutation = useMutation({
    mutationFn: (vars: { fileType: string }) => api.post(`/events/${eventId}/generate-upload-code`, { fileType: vars.fileType }),
    onSuccess: (response) => {
      setCode(response.data.uploadCode);
      queryClient.invalidateQueries({ queryKey: ['files', eventId] });
      try {
        window.dispatchEvent(new CustomEvent('uploadCodeChanged', { detail: { eventId } }));
      } catch {
        // ignore
      }
    },
    onError: (error: unknown) => {
      console.error('Erro ao gerar código', error);
      let msg = 'Erro ao gerar código. Verifique o console para mais detalhes.';
      try {
        const maybe = error as unknown as { response?: { data?: { message?: string } } };
        if (maybe && maybe.response && maybe.response.data && maybe.response.data.message) {
          msg = maybe.response.data.message;
        }
      } catch (parseErr) {
        console.error('Erro extraindo mensagem de erro', parseErr);
      }
      alert(msg);
    },
  });

  const handleGenerateCode = () => {
    // diagnostic log to ensure payload is correct when calling backend
    console.log('[diag] generate-upload-code payload', { eventId, fileType });
    if (!fileType) {
      alert('fileType está ausente. Não é possível gerar código.');
      return;
    }
    generateCodeMutation.mutate({ fileType });
  };

  const handleClose = () => {
    setCode(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <ModalTitle>Receber {fileLabel ?? ''}</ModalTitle>
        <CloseButton onClick={handleClose}><X size={24} /></CloseButton>
      </ModalHeader>

      <Instructions>
        Gere um código único para fornecer à clínica ou laboratório. Eles usarão este código para enviar o {(fileLabel ?? '').toLowerCase()} diretamente para este evento.
      </Instructions>

      {!code ? (
        <Button onClick={handleGenerateCode} disabled={generateCodeMutation.isPending}>
          {generateCodeMutation.isPending ? 'Gerando...' : 'Gerar Código'}
        </Button>
      ) : (
        <>
          <p>Código gerado com sucesso!</p>
          <CodeDisplay>{code}</CodeDisplay>
          <p>Forneça este código de 6 dígitos para a clínica ou laboratório responsável pelo {fileLabel.toLowerCase()}.</p>
        </>
      )}

      <ModalFooter>
        <Button onClick={handleClose}>Fechar</Button>
      </ModalFooter>
    </Modal>
  );
}
