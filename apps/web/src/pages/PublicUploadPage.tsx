import { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { File, CheckCircle, WarningCircle } from 'phosphor-react';

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f4f7f6;
  padding: 2rem;
`;

const UploadBox = styled.div`
  width: 100%;
  max-width: 500px;
  background: #fff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  text-align: center;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

// NOVO: Styled component para o Select
const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: #EDEDED;
  color: ${({ theme }) => theme.colors.text};
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e" );
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
`;

const FileInputLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors['primary-blue']};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors['feedback-error']};
  margin-top: 1rem;
`;

const SuccessMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: ${({ theme }) => theme.colors['feedback-success']};
`;

// NOVO: Constante com os tipos de arquivo
const FILE_TYPES = [
  { value: 'Requisicao', label: 'Requisição de Exame' },
  { value: 'Autorizacao', label: 'Autorização de Convênio' },
  { value: 'Atestado', label: 'Atestado Médico' },
  { value: 'Prescricao', label: 'Prescrição / Receita' },
  { value: 'LaudoResultado', label: 'Laudo / Resultado de Exame' },
  { value: 'NotaFiscal', label: 'Nota Fiscal / Recibo' },
];

export function PublicUploadPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [uploadCode, setUploadCode] = useState('');
  const [fileType, setFileType] = useState(''); // NOVO ESTADO
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => api.post(`/events/${eventId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      setIsSuccess(true);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ocorreu um erro. Verifique os dados e tente novamente.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadCode || !fileType) { // Adicionado fileType à validação
      setError('Todos os campos são obrigatórios.');
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_code', uploadCode);
    formData.append('file_type', fileType); // Adicionado fileType ao FormData
    mutation.mutate(formData);
  };

  if (isSuccess) {
    return (
      <PageContainer>
        <UploadBox>
          <SuccessMessage>
            <CheckCircle size={64} weight="fill" />
            <Title>Documento Enviado com Sucesso!</Title>
            <Subtitle>Obrigado. O paciente será notificado.</Subtitle>
          </SuccessMessage>
        </UploadBox>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <UploadBox>
        <Title>Envio Seguro de Documento</Title>
        <Subtitle>Omni Saúde</Subtitle>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            value={uploadCode}
            onChange={(e) => setUploadCode(e.target.value)}
            placeholder="Digite o Código de Envio"
            maxLength={6}
            disabled={mutation.isPending}
          />
          {/* NOVO CAMPO SELECT */}
          <Select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            disabled={mutation.isPending}
            required
          >
            <option value="" disabled>Selecione o tipo de documento...</option>
            {FILE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </Select>

          <FileInputLabel>
            <HiddenInput
              type="file"
              accept="image/jpeg,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setSelectedFile(null);
                  return;
                }

                // Validação do tipo de arquivo
                if (file.type !== 'image/jpeg') {
                  alert('Apenas arquivos JPG são aceitos.');
                  setSelectedFile(null);
                  return;
                }

                // Validação do tamanho do arquivo (6KB = 6144 bytes)
                if (file.size > 6144) {
                  alert('O arquivo deve ter no máximo 6KB.');
                  setSelectedFile(null);
                  return;
                }

                setSelectedFile(file);
              }}
              disabled={mutation.isPending}
            />
            {selectedFile ? (
              <>
                <File size={32} />
                <span>{selectedFile.name}</span>
              </>
            ) : (
              <>
                <File size={32} />
                <span>Clique para selecionar o arquivo</span>
              </>
            )}
          </FileInputLabel>
          <Button type="submit" disabled={mutation.isPending || !selectedFile || !uploadCode || !fileType}>
            {mutation.isPending ? 'Enviando...' : 'Enviar Documento'}
          </Button>
          {error && (
            <ErrorMessage>
              <WarningCircle size={16} style={{ verticalAlign: 'middle' }} /> {error}
            </ErrorMessage>
          )}
        </Form>
      </UploadBox>
    </PageContainer>
  );
}
