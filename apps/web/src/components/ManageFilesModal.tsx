import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { X, CloudArrowUp } from 'phosphor-react';
import { api } from '../services/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { FileSlot } from './FileSlot'; // Reutilizando o componente de slot
import { ReceiveFileModal } from './ReceiveFileModal';

// Tipagem
interface EventFile {
  id: string;
  file_name: string;
  file_type: string;
  url: string;
}

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

const SlotsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr; // Sempre duas colunas no modal
  gap: 1rem;
`;

const SlotWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ReceiveButton = styled(Button)`
  align-self: flex-start;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
`;

const CodeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #e9f7ef;
  border: 1px solid #cbeedd;
  color: #1b6b3a;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-family: monospace;
`;

const SmallCopy = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
`;

// Constantes
const FILE_TYPES = [
  { type: 'Requisicao', label: 'Requisição' },
  { type: 'Autorizacao', label: 'Autorização' },
  { type: 'Atestado', label: 'Atestado' },
  { type: 'Prescricao', label: 'Prescrição' },
  { type: 'LaudoResultado', label: 'Laudo/Resultado' },
  { type: 'NotaFiscal', label: 'Nota Fiscal' },
];

// Função da API
const fetchFiles = async (eventId: string): Promise<EventFile[]> => {
  try {
    // Tentar buscar com autenticação primeiro
    const { data } = await api.get(`/events/${eventId}/files`);
    return data;
  } catch (error) {
    // Se falhar por autenticação, tentar endpoint público
    const err = error as { response?: { status?: number } };
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      const { data } = await api.get(`/files/events/${eventId}/files/public`);
      return data;
    }
    throw error;
  }
};

interface ManageFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  occurrenceTimestamp?: string;
}

export function ManageFilesModal({ isOpen, onClose, eventId, occurrenceTimestamp }: ManageFilesModalProps) {
  const [receiveModal, setReceiveModal] = useState<{ isOpen: boolean; fileType: string; fileLabel: string } | null>(null);
  const [existingCodes, setExistingCodes] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!isOpen) return;
    const fetchCodes = async () => {
      try {
        const resp = await api.get(`/events/${eventId}/upload-codes`);
        setExistingCodes(resp.data?.codes || {});
      } catch {
        setExistingCodes({});
      }
    };
    fetchCodes();
    const onChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (!ce?.detail || ce.detail.eventId !== eventId) return;
      // refetch codes
      fetchCodes();
    };
    window.addEventListener('uploadCodeChanged', onChange as EventListener);
    return () => { window.removeEventListener('uploadCodeChanged', onChange as EventListener); };
  }, [isOpen, eventId]);

  const { data: files, isLoading } = useQuery({
    queryKey: ['files', eventId], // Chave de query específica para os arquivos deste evento
    queryFn: () => fetchFiles(eventId),
    enabled: isOpen, // Só busca os dados quando o modal está aberto
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Gerenciar Arquivos do Evento</ModalTitle>
        <CloseButton onClick={onClose}><X size={24} /></CloseButton>
      </ModalHeader>
      
      {isLoading ? (
        <p>Carregando arquivos...</p>
      ) : (
        <SlotsGrid>
          {FILE_TYPES.map(({ type, label }) => {
            // Encontra o arquivo correspondente para este slot
            const fileData = files?.find(f => f.file_type === type);
            const codeForType = existingCodes[type];
            return (
              <SlotWrapper key={type}>
                <FileSlot
                  eventId={eventId}
                  fileType={type}
                  fileLabel={label}
                  fileData={fileData}
                  occurrenceTimestamp={occurrenceTimestamp}
                />
                {codeForType ? (
                  <CodeBadge>
                    <span>{codeForType}</span>
                    <SmallCopy onClick={() => { navigator.clipboard.writeText(codeForType); }} title="Copiar código">📋</SmallCopy>
                  </CodeBadge>
                ) : (
                  !fileData && (
                    <ReceiveButton onClick={() => { console.log('[diag] open receive modal', { eventId, fileType: type, fileLabel: label }); setReceiveModal({ isOpen: true, fileType: type, fileLabel: label }); }}>
                      <CloudArrowUp size={16} style={{ marginRight: '0.25rem' }} />
                      Receber
                    </ReceiveButton>
                  )
                )}
              </SlotWrapper>
            );
          })}
        </SlotsGrid>
      )}

      <ModalFooter>
        <Button onClick={onClose} style={{ backgroundColor: '#6c757d' }}>Fechar</Button>
      </ModalFooter>

      {receiveModal && (
        <ReceiveFileModal
          isOpen={receiveModal.isOpen}
          onClose={() => setReceiveModal(null)}
          eventId={eventId}
          fileType={receiveModal.fileType}
          fileLabel={receiveModal.fileLabel}
        />
      )}
    </Modal>
  );
}
