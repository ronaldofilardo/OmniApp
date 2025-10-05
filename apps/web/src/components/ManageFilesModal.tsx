import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { X } from 'phosphor-react';
import { api } from '../services/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { FileSlot } from './FileSlot'; // Reutilizando o componente de slot

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
  const { data } = await api.get(`/events/${eventId}/files`);
  return data;
};

interface ManageFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  occurrenceTimestamp?: string;
}

export function ManageFilesModal({ isOpen, onClose, eventId, occurrenceTimestamp }: ManageFilesModalProps) {
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
            return (
              <FileSlot
                key={type}
                eventId={eventId}
                fileType={type}
                fileLabel={label}
                fileData={fileData}
                occurrenceTimestamp={occurrenceTimestamp}
              />
            );
          })}
        </SlotsGrid>
      )}

      <ModalFooter>
        <Button onClick={onClose} style={{ backgroundColor: '#6c757d' }}>Fechar</Button>
      </ModalFooter>
    </Modal>
  );
}
