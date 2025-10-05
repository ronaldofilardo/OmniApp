import { useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

// ... (Styled Components)
const PageContainer = styled.div` max-width: 500px; margin: 4rem auto; padding: 2rem; text-align: center; `;
const FileList = styled.ul` list-style: none; padding: 0; margin-top: 2rem; `;
const FileListItem = styled.li` margin-bottom: 1rem; `;
const FileLink = styled.a` font-size: 1.1rem; `;

interface SharedFile { fileName: string; url: string; }

export function SharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [accessCode, setAccessCode] = useState('');
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => api.post('/sharing/verify', { shareToken, accessCode: code }),
    onSuccess: (response) => {
      console.log('[SharePage] verify success response:', response?.data);
      const { accessToken } = response.data;
      api.get(`/sharing/files/${accessToken}`)
        .then(res => {
          console.log('[SharePage] fetched shared files:', res.data);
          setFiles(res.data);
          setIsVerified(true);
          setError(null);
        })
        .catch((fetchErr) => {
          console.error('[SharePage] erro ao buscar arquivos:', fetchErr);
          setError('Não foi possível buscar os arquivos compartilhados.');
        });
    },
    onError: (err: any) => {
      console.error('[SharePage] verify error:', err);
      if (!err || !err.response) {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
        return;
      }
      setError(err.response?.data?.message || 'Erro ao verificar.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('[SharePage] submit verify', { shareToken, accessCode });
    if (!shareToken) {
      setError('Token de compartilhamento inválido. Reabra o link.');
      return;
    }
    if (!/^[0-9]{6}$/.test(accessCode)) {
      setError('Informe o código de 6 dígitos.');
      return;
    }
    verifyMutation.mutate(accessCode);
  };

  if (isVerified) {
    return (
      <PageContainer>
        <h1>Arquivos Compartilhados</h1>
        <FileList>
          {files.map(file => (
            <FileListItem key={file.url}>
              <FileLink href={file.url} target="_blank" rel="noopener noreferrer">{file.fileName}</FileLink>
            </FileListItem>
          ))}
        </FileList>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1>Acesso a Documentos</h1>
      <p>Por favor, insira o código de acesso fornecido pelo paciente.</p>
      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <Input
          type="text"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Código de 6 dígitos"
          maxLength={6}
        />
        <Button type="submit" style={{ marginTop: '1rem' }} disabled={verifyMutation.isPending || accessCode.length !== 6}>
          {verifyMutation.isPending ? 'Verificando...' : 'Acessar Arquivos'}
        </Button>
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      </form>
    </PageContainer>
  );
}
