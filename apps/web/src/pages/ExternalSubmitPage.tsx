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
  max-width: 600px;
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

const FileInputLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors['primary-blue']};
  }
`;

const DropZone = styled.div<{ $isDragOver: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed ${({ $isDragOver }) => ($isDragOver ? '#007bff' : '#d9d9d9')};
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  background-color: ${({ $isDragOver }) => ($isDragOver ? '#f0f8ff' : 'transparent')};

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


const ProfessionalInputContainer = styled.div`
  position: relative;
`;

const ProfessionalInput = styled(Input)`
  width: 100%;
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SuggestionItem = styled.li`
  padding: 0.5rem;
  cursor: pointer;
  &:hover {
    background: #f0f0f0;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;


export function ExternalSubmitPage() {
  const [email, setEmail] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [professional, setProfessional] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [eventType, setEventType] = useState<'Exame' | 'Consulta'>('Exame');
  
  // filesBySlot mantém até um arquivo por tipo
  const [filesBySlot, setFilesBySlot] = useState<Record<string, File | null>>({
    file_requisicao: null,
    file_autorizacao: null,
    file_atestado: null,
    file_prescricao: null,
    file_laudo_resultado: null,
    file_nota_fiscal: null,
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [professionalSuggestions, setProfessionalSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/external/submit-exam', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      setIsSuccess(true);
      setError(null);
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, 'Ocorreu um erro. Verifique os dados e tente novamente.');
      setError(message);
    },
  });

  function getErrorMessage(err: unknown, fallback = 'Erro') {
    if (!err) return fallback;
    try {
      const maybe = err as { response?: { data?: { message?: string } }; message?: string };
      return maybe.response?.data?.message || maybe.message || fallback;
    } catch {
      return fallback;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !professional || !eventDate || !startTime) {
      setError('Todos os campos obrigatórios devem ser preenchidos.');
      return;
    }

    // coletar arquivos presentes
    const presentFiles = Object.entries(filesBySlot).filter(([, f]) => f) as [string, File][];
    if (presentFiles.length === 0) {
      setError('Ao menos um arquivo de imagem deve ser anexado.');
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('clinic_name', clinicName);
    formData.append('professional', professional);
    formData.append('event_date', eventDate);
    formData.append('start_time', startTime);
    formData.append('event_type', eventType);
    formData.append('notes', notes);

    for (const [key, file] of presentFiles) {
      if (!file) continue;
      formData.append(key, file);
    }

    mutation.mutate(formData);
  };

  // Buscar sugestões de profissionais
  useEffect(() => {
    if (!email || !professional || professional.length < 2) {
      setProfessionalSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const resp = await api.get(`/users/professionals/search?email=${encodeURIComponent(email)}&query=${encodeURIComponent(professional)}`);
        if (cancelled) return;
        setProfessionalSuggestions(resp.data.professionals || []);
        setShowSuggestions(true);
      } catch {
        if (cancelled) return;
        setProfessionalSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [email, professional]);

  const handleProfessionalSelect = (name: string) => {
    setProfessional(name);
    setShowSuggestions(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDropToSlot = (slotKey: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        alert('Apenas arquivos do tipo imagem são aceitos.');
        return;
      }
      if (file.size > 2 * 1024) {
        alert('O arquivo deve ter no máximo 2KB.');
        return;
      }
      setFilesBySlot(prev => ({ ...prev, [slotKey]: file }));
    }
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
        <Title>Portal de Envio Externo</Title>
        <Subtitle>Omni Saúde - Envio de Documentos para Exames</Subtitle>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail do Paciente"
            required
            disabled={mutation.isPending}
          />

          <Input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="Nome da Clínica/Laboratório (opcional)"
            disabled={mutation.isPending}
          />

          <ProfessionalInputContainer>
            <ProfessionalInput
              type="text"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
              placeholder="Médico Solicitante"
              required
              disabled={mutation.isPending}
            />
            {showSuggestions && professionalSuggestions.length > 0 && (
              <SuggestionsList>
                {professionalSuggestions.map((name, idx) => (
                  <SuggestionItem key={idx} onClick={() => handleProfessionalSelect(name)}>
                    {name}
                  </SuggestionItem>
                ))}
              </SuggestionsList>
            )}
          </ProfessionalInputContainer>

          <Input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            disabled={mutation.isPending}
          />

          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            disabled={mutation.isPending}
          />

          <Select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as 'Exame' | 'Consulta')}
            disabled={mutation.isPending}
          >
            <option value="Exame">Exame</option>
            <option value="Consulta">Consulta</option>
          </Select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { key: 'file_requisicao', label: 'Requisição' },
              { key: 'file_autorizacao', label: 'Autorização' },
              { key: 'file_atestado', label: 'Atestado' },
              { key: 'file_prescricao', label: 'Prescrição' },
              { key: 'file_laudo_resultado', label: 'Laudo/Resultado' },
              { key: 'file_nota_fiscal', label: 'Nota Fiscal' },
            ].map((slot) => {
              const current = filesBySlot[slot.key];
              return (
                <DropZone
                  key={slot.key}
                  $isDragOver={isDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropToSlot(slot.key)}
                >
                  <FileInputLabel>
                    <HiddenInput
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setFilesBySlot(prev => ({ ...prev, [slot.key]: null }));
                          return;
                        }
                        if (!file.type.startsWith('image/')) {
                          alert('Apenas arquivos do tipo imagem são aceitos.');
                          return;
                        }
                        if (file.size > 2 * 1024) {
                          alert('O arquivo deve ter no máximo 2KB.');
                          return;
                        }
                        setFilesBySlot(prev => ({ ...prev, [slot.key]: file }));
                      }}
                      disabled={mutation.isPending}
                    />
                    {current ? (
                      <>
                        <File size={32} />
                        <span>{current.name}</span>
                        <div style={{ marginTop: 8 }}>
                          <button type="button" onClick={() => setFilesBySlot(prev => ({ ...prev, [slot.key]: null }))}>Remover</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <File size={32} />
                        <span>{slot.label}</span>
                      </>
                    )}
                  </FileInputLabel>
                </DropZone>
              );
            })}
          </div>

          <Input
            as="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações (opcional)"
            rows={3}
            disabled={mutation.isPending}
          />

          <Button type="submit" disabled={mutation.isPending}>
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