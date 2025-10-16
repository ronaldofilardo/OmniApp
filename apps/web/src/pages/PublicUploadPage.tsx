import { useState, useEffect } from 'react';
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

// Removido Select

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

// Removido FILE_TYPES

export function PublicUploadPage() {
  const [uploadCode, setUploadCode] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expectedType, setExpectedType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/files/upload-by-code', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      setIsSuccess(true);
      setError(null);
    },
    onError: (err: unknown) => {
      // extrair mensagem de erro de forma segura
      const message = getErrorMessage(err, 'Ocorreu um erro. Verifique os dados e tente novamente.');
      setError(message);
    },
  });

  // Utilitário local para extrair mensagens de erro sem usar `any`
  function getErrorMessage(err: unknown, fallback = 'Erro') {
    if (!err) return fallback;
    // tentar acessar campos comuns de axios/error
    try {
      const maybe = err as { response?: { data?: { message?: string } }; message?: string };
      return maybe.response?.data?.message || maybe.message || fallback;
    } catch {
      return fallback;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadCode) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    // Se já soubermos o tipo esperado, validar o mime-type básico
    if (expectedType) {
      const lowercase = expectedType.toLowerCase();
      if (lowercase.includes('pdf') && selectedFile.type !== 'application/pdf') {
        setError('Este envio exige um arquivo PDF.');
        return;
      }
      if (lowercase.includes('imagem') && !selectedFile.type.startsWith('image/')) {
        setError('Este envio exige um arquivo de imagem.');
        return;
      }
    }
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_code', uploadCode);
    mutation.mutate(formData);
  };

  // Ao alterar o código, buscar o tipo esperado (com debounce simples)
  useEffect(() => {
    if (!uploadCode || uploadCode.length < 3) {
      setExpectedType(null);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const resp = await api.get(`/files/upload-code/${encodeURIComponent(uploadCode)}`);
        if (cancelled) return;
        // espera que o backend retorne { expected_type: '...' } ou similar
        const data = resp.data as { expected_type?: string; file_type?: string } | undefined;
        setExpectedType(data?.expected_type || data?.file_type || null);
      } catch {
        if (cancelled) return;
        // não tratar como erro visual, apenas limpar
        setExpectedType(null);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [uploadCode]);

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

          <FileInputLabel>
            <HiddenInput
              type="file"
              accept={expectedType && expectedType.toLowerCase().includes('pdf') ? '.pdf,application/pdf' : 'image/*'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setSelectedFile(null);
                  return;
                }

                // Validação: aceitar apenas imagens e tamanho máximo 2KB
                if (!file.type || !file.type.startsWith('image/')) {
                  alert('Apenas arquivos do tipo imagem são aceitos.');
                  setSelectedFile(null);
                  return;
                }

                // Validação do tamanho do arquivo (2KB = 2048 bytes)
                if (file.size > 2 * 1024) {
                  alert('O arquivo deve ter no máximo 2KB.');
                  setSelectedFile(null);
                  return;
                }

                setSelectedFile(file);
              }}
              disabled={mutation.isPending}
            />
            {/* mostrar tipo esperado abaixo do input */}
            {expectedType && (
              <div style={{ width: '100%', textAlign: 'center', marginBottom: '8px', color: '#666' }}>
                Tipo esperado: <strong>{expectedType}</strong>
              </div>
            )}
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
          <Button type="submit" disabled={mutation.isPending || !selectedFile || !uploadCode}>
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
