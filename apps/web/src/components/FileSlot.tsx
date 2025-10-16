import { useRef } from 'react';
import { useToast } from './useToast';
import styled, { css } from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, UploadSimple, Trash, File, CircleNotch } from 'phosphor-react';
import { api } from '../services/api';

// --- Tipagem ---
interface FileData {
  id: string;
  file_name: string;
  url?: string | null;
}

interface FileSlotProps {
  eventId: string;
  fileType: string;
  fileLabel: string;
  fileData?: FileData;
  occurrenceTimestamp?: string;
}

// Utilitário local para extrair mensagem segura de erro
function safeErrorMessage(err: unknown, fallback = 'Erro') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = err as any;
    return anyErr?.response?.data?.message || anyErr?.message || fallback;
  } catch {
    return fallback;
  }
}

// --- Styled Components ---
const SlotContainer = styled.div<{ $hasFile: boolean; $isUploading: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 2px dashed #d9d9d9;
    background-color: #fafafa;
    width: 100%;
    margin-bottom: 0.75rem;

    @media (max-width: 600px) {
      padding: 0.5rem 0.3rem;
      font-size: 0.97rem;
      margin-bottom: 0.5rem;
    }


  &:hover {
    border-color: #2563eb;
  }

  ${({ $hasFile }) => $hasFile && css`
    background-color: #f0fff4;
    border-style: solid;
    border-color: #10b981;
    cursor: default;

    p, svg {
      color: #10b981;
    }
  `}

  ${({ $isUploading }) => $isUploading && css`
    cursor: not-allowed;
    opacity: 0.7;
  `}
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
`;

const FileLabel = styled.p`
  font-weight: 500;
`;

const FileNameDetail = styled.span`
  font-size: 0.8rem;
  color: #666;
  margin-left: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const FileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  color: #888;
  transition: color 0.2s;

  &:hover {
    color: #2563eb;
  }
`;

const DeleteButton = styled(ActionButton)`
  &:hover {
    color: #ef4444;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const LoadingSpinner = styled(CircleNotch)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// --- Lógica da API ---
const uploadFile = async ({ eventId, fileType, file }: { eventId: string, fileType: string, file: File }) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);
  
  await api.post(`/events/${eventId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

const deleteFile = async (fileId: string) => {
  await api.delete(`/files/${fileId}`);
};

// NOVA FUNÇÃO DA API
const markFileAsViewed = async (fileId: string) => {
  await api.post(`/files/${fileId}/mark-as-viewed`);
};

// --- Componente Principal ---
export function FileSlot({ eventId, fileType, fileLabel, fileData, occurrenceTimestamp }: FileSlotProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ocorrência pode ser passada ou futura; mantemos o valor apenas para compatibilidade de props
  // e evitamos 'declared but never used' com um no-op
  void occurrenceTimestamp;

  const toast = useToast();

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', eventId] });
      queryClient.invalidateQueries({ queryKey: ['repository-files'] });
      queryClient.invalidateQueries({ queryKey: ['events'] }); // Invalida eventos para atualizar o status de notificação
    },
    onError: (err: unknown) => {
      toast.show(safeErrorMessage(err, 'Erro ao enviar arquivo.'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', eventId] });
      queryClient.invalidateQueries({ queryKey: ['repository-files'] });
      queryClient.invalidateQueries({ queryKey: ['events'] }); // Invalida eventos para atualizar o status de notificação
    },
    onError: (err: unknown) => {
      toast.show(safeErrorMessage(err, 'Erro ao deletar arquivo.'), 'error');
    },
  });

  // NOVA MUTAÇÃO
  const markAsViewedMutation = useMutation({
    mutationFn: markFileAsViewed,
    onSuccess: () => {
      // Invalida a query de eventos para que o ícone de "não visto" desapareça da timeline
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    // Não precisa de onError, pois se falhar, o usuário pode simplesmente tentar de novo
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        // Validação: aceitar apenas imagens e máximo 2KB
        if (!file.type || !file.type.startsWith('image/')) {
          alert('Apenas arquivos do tipo imagem são permitidos');
          return;
        }

        if (file.size > 2 * 1024) { // 2KB
          alert('Arquivo muito grande. Máximo permitido: 2KB');
          return;
        }
      
      uploadMutation.mutate({ eventId, fileType, file });
    }
  };

  const triggerFileUpload = () => {
    // sempre permitido
    if (!fileData && !uploadMutation.isPending) {
      fileInputRef.current?.click();
    }
  };

  const handleDelete = () => {
    // sempre permitido
    if (fileData && window.confirm(`Tem certeza que deseja excluir o arquivo "${fileData.file_name}"?`)) {
      deleteMutation.mutate(fileData.id);
    }
  };

  // NOVA FUNÇÃO
  const handleViewClick = () => {
    // sempre permitido
    if (fileData) {
      markAsViewedMutation.mutate(fileData.id);
    }
  };

  const isBusy = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <SlotContainer 
      $hasFile={!!fileData} 
      $isUploading={uploadMutation.isPending}
      onClick={triggerFileUpload}
    >
      <FileInfo>
        <File size={20} />
        <FileLabel>{fileLabel}</FileLabel>
        {fileData && (
          <FileNameDetail title={fileData.file_name}>
            ({fileData.file_name})
          </FileNameDetail>
        )}
      </FileInfo>
      <FileActions onClick={(e) => e.stopPropagation()}>
        {isBusy ? (
          <LoadingSpinner size={20} />
        ) : fileData ? (
          <>
            {/* O `onClick` foi adicionado ao link/botão de visualização */}
            {fileData.url ? (
              <ActionButton as="a" href={fileData.url} target="_blank" rel="noopener noreferrer" title="Visualizar" onClick={handleViewClick}>
                <Eye size={20} />
              </ActionButton>
            ) : (
              <ActionButton onClick={() => {
                // Abre a URL de visualização do arquivo sem token
                const apiBaseUrl = api.defaults.baseURL || 'http://localhost:3333';
                const viewUrl = `${apiBaseUrl}/files/${fileData.id}/view`;
                window.open(viewUrl, '_blank', 'noopener');
                handleViewClick();
              }} title="Visualizar">
                <Eye size={20} />
              </ActionButton>
            )}
            <DeleteButton onClick={handleDelete} disabled={deleteMutation.isPending} title="Excluir">
              <Trash size={20} />
            </DeleteButton>
          </>
        ) : (
          <ActionButton onClick={triggerFileUpload} disabled={uploadMutation.isPending} title="Fazer upload">
            <UploadSimple size={20} />
          </ActionButton>
        )}
      </FileActions>
  <HiddenInput type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
    </SlotContainer>
  );
}
