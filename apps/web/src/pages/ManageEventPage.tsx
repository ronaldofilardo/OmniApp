import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select, { type SingleValue } from 'react-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// CORREÇÃO: Importando o novo schema simplificado
import { createPontualEventSchema, type CreatePontualEvent } from 'shared/src/validations';
import { api } from '../services/api';

import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ProfessionalFormModal } from '../components/ProfessionalFormModal';
import { Input } from '../components/Input';
import { useToast } from '../components/useToast';

registerLocale('pt-BR', ptBR);

// Read travel gap minutes from Vite env safely (browser-friendly)
const TRAVEL_GAP_MINUTES = Number(import.meta.env.VITE_TRAVEL_GAP_MINUTES ?? 60);

// Helper to render a human-friendly summary for a conflict
const renderConflictSummary = (c: Record<string, unknown>) => {
  const rawDate = String(c['event_date'] || '');
  const parseDate = (raw: string) => {
    if (!raw) return null;
    try {
      if (raw.includes('T')) {
        const dt = new Date(raw);
        return isNaN(dt.getTime()) ? null : dt;
      }
      const dt = new Date(raw + 'T00:00:00');
      return isNaN(dt.getTime()) ? null : dt;
    } catch {
      return null;
    }
  };

  const dateObj = parseDate(rawDate);
  const dateStr = dateObj ? format(dateObj, 'dd/MMM/yyyy', { locale: ptBR }) : rawDate;
  const startRaw = String(c['start_time'] || '').slice(0,5);
  const endRaw = String(c['end_time'] || '').slice(0,5);

  let suggestion = '';
  if (dateObj && startRaw && endRaw) {
    try {
      const [sh, sm] = startRaw.split(':').map(Number);
      const [eh, em] = endRaw.split(':').map(Number);
      const stDate = new Date(dateObj);
      stDate.setHours(sh, sm, 0, 0);
      const enDate = new Date(dateObj);
      enDate.setHours(eh, em, 0, 0);
      const earliestEnd = new Date(stDate.getTime() - TRAVEL_GAP_MINUTES * 60000);
      const latestStart = new Date(enDate.getTime() + TRAVEL_GAP_MINUTES * 60000);
      const timeFmt = (dt: Date) => format(dt, 'HH:mm');
      suggestion = `Poderá marcar um evento que termine até ${timeFmt(earliestEnd)} ou inicie a partir das ${timeFmt(latestStart)}.`;
    } catch {
      // fallback: no suggestion
      suggestion = '';
    }
  }

  return `${String(c['type'] || '')} - ${String(c['professional'] || '')} - ${dateStr} entre ${startRaw}${startRaw && endRaw ? ` - ${endRaw}` : ''}. ${suggestion}`.trim();
};

// Helper to render a friendly message for overlap conflicts
const renderOverlapMessage = (conflicts: Array<Record<string, unknown>> | undefined) => {
  if (!conflicts || conflicts.length === 0) return 'Horário em conflito com outro evento.';
  // Use the first conflict to build a short message
  const c = conflicts[0];
  const start = String(c['start_time'] || '').slice(0,5);
  const end = String(c['end_time'] || '').slice(0,5);
  const type = String(c['type'] || 'Evento');
  const prof = String(c['professional'] || 'Profissional');
  if (start && end) {
    return `Existe um ${type.toLowerCase()} para ${prof} entre ${start} e ${end}.`;
  }
  return `Existe um ${type.toLowerCase()} para ${prof}.`;
};

// Styled Components (sem alterações)
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  width: 100%;
  min-height: 100vh;
  background-color: #f8f9fa;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 700px;
  padding: 2.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #444;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Row = styled.div`
  display: flex;
  gap: 1rem;
  & > * {
    flex: 1;
  }
`;

const ProfessionalControl = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
`;

const ProfessionalSelectWrapper = styled.div`
  flex-grow: 1;
`;

const NewButton = styled(Button)`
  flex-shrink: 0;
  width: auto;
  padding: 0.5rem 1rem;
  height: 38px;
  align-self: center;
  margin-bottom: 1px;
`;

const DateHelperText = styled.span`
  font-size: 0.875rem;
  color: #666;
  padding-left: 0.5rem;
  height: 1rem;
  text-transform: capitalize;
`;

const NotesWrapper = styled.div`
  position: relative;
`;

const NotesTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  background-color: #EDEDED;
  color: #333333;
  font-family: 'Roboto', sans-serif;
  font-size: 1rem;
  resize: vertical;
`;

const CharCounter = styled.span`
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 0.75rem;
  color: #666;
`;

const Footer = styled.footer`
  margin-top: 4rem;
  color: #888;
  font-size: 0.875rem;
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

interface SelectOption {
  value: string;
  label: string;
  isFixed?: boolean;
}

// CORREÇÃO: Opções de tipo simplificadas
const typeOptions: SelectOption[] = [
  { value: 'Consulta', label: 'Consulta' },
  { value: 'Exame', label: 'Exame' },
];

const fetchProfessionals = async (): Promise<SelectOption[]> => {
  const { data } = await api.get('/professionals');
  return data.map((prof: { name: string; specialty: string }) => ({
    value: prof.name,
    label: `${prof.name} - ${prof.specialty}`,
  }));
};

const fetchEventById = async (id: string) => {
  const { data } = await api.get(`/events/${id}`);
  return data;
};

const createEvent = async (data: CreatePontualEvent) => {
  return api.post('/events', data);
};

const updateEvent = async ({ id, data }: { id: string, data: CreatePontualEvent }) => {
  return api.put(`/events/${id}`, data);
};

export function ManageEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { eventId } = useParams<{ eventId: string }>();
  const isEditMode = Boolean(eventId);

  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isProfessionalModalOpen, setProfessionalModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePontualEvent | null>(null);
  const [travelConflicts, setTravelConflicts] = useState<Array<Record<string, unknown>> | null>(null);
  const [isTravelConfirmOpen, setTravelConfirmOpen] = useState(false);
  const [formConflict, setFormConflict] = useState<null | { type: 'overlap' | 'travel_gap'; message: string; conflicts?: Array<Record<string, unknown>> }>(null);
  // (intentionally no separate loading state needed for proactive check)
  
  const methods = useForm<CreatePontualEvent>({
    // CORREÇÃO: Usando o novo schema
    resolver: zodResolver(createPontualEventSchema),
    mode: 'onChange',
  });

  const toast = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = methods;

  // Watch fields that, when changed, should clear any existing conflict and override
  const watchedProfessional = watch('professional');
  const watchedDate = watch('event_date');
  const watchedStart = watch('start_time');
  const watchedEnd = watch('end_time');

  const { data: professionalOptions = [], isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: fetchProfessionals,
  });

  const { data: existingEventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (isEditMode && existingEventData) {
      reset(existingEventData);
    }
  }, [isEditMode, existingEventData, reset]);

  const notesValue = watch('notes', '') || '';
  // Estado para controlar exibição do campo de instruções
  const [showInstructions, setShowInstructions] = useState(false);

  const formattedDayOfWeek = useMemo(() => {
    if (!watchedDate) return '';
    try {
      const date = new Date(watchedDate + 'T00:00:00');
      if (isNaN(date.getTime())) return '';
      return format(date, "dd/MM/yyyy - EEEE", { locale: ptBR });
    } catch {
      return '';
    }
  }, [watchedDate]);

  const mutation = useMutation({
    mutationFn: (data: CreatePontualEvent) => isEditMode ? updateEvent({ id: eventId!, data }) : createEvent(data),
    onSuccess: () => {
      toast.show(`Evento ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      navigate('/timeline');
    },
    onError: (error: unknown) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyErr = error as any;
        // Handle conflicts specially (409)
        if (anyErr?.response?.status === 409) {
          const ct = anyErr?.response?.data?.conflictType;
          const conflicts = anyErr?.response?.data?.conflicts || [];
          if (ct === 'travel_gap') {
            setTravelConflicts(conflicts);
            setFormConflict({ type: 'travel_gap', message: anyErr?.response?.data?.message || 'Conflito de deslocamento detectado.', conflicts });
            setTravelConfirmOpen(true);
            return;
          }
          if (ct === 'overlap') {
            const msg = renderOverlapMessage(conflicts);
            setFormConflict({ type: 'overlap', message: msg, conflicts });
            return;
          }
        }
        toast.show(anyErr?.response?.data?.message || anyErr?.message || 'Ocorreu um erro.', 'error');
      } catch {
        toast.show('Ocorreu um erro.', 'error');
      }
    }
  });

  const onFormSubmit = (data: CreatePontualEvent) => {
    setFormData(data);
    setReviewModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (formData) {
      mutation.mutate(formData);
      setReviewModalOpen(false);
    }
  };

  const handleConfirmTravelOverride = async () => {
    if (!formData) return;
    try {
      const payload = { ...(formData as Record<string, unknown>), override_travel_conflict: true } as Record<string, unknown>;
      if (isEditMode) {
        await updateEvent({ id: eventId!, data: payload as unknown as CreatePontualEvent });
      } else {
        await createEvent(payload as unknown as CreatePontualEvent);
      }
      toast.show('Evento criado/atualizado com override de deslocamento.', 'success');
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      setTravelConfirmOpen(false);
      navigate('/timeline');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr = err as any;
      toast.show(anyErr?.response?.data?.message || 'Falha ao criar evento.', 'error');
    }
  };

  const handleProfessionalChange = (option: SingleValue<SelectOption>) => {
    if (option?.value === 'add_new') {
      setProfessionalModalOpen(true);
    } else {
      setValue('professional', option ? option.value : '', { shouldValidate: true });
    }
  };

  const handleProfessionalSuccess = (newProfessional: SelectOption) => {
    queryClient.invalidateQueries({ queryKey: ['professionals'] });
    setValue('professional', newProfessional.value, { shouldValidate: true });
  };

  const professionalOptionsWithAdd: SelectOption[] = [
    ...professionalOptions,
    { value: 'add_new', label: 'Adicionar novo profissional...', isFixed: true },
  ];

  // Clear conflict state when user edits relevant fields to avoid stale overrides/loops
  useEffect(() => {
    setFormConflict(null);
    setTravelConflicts(null);
    // We intentionally don't auto-close modals here; only reset conflict indicators
  }, [watchedProfessional, watchedDate, watchedStart, watchedEnd]);

  // Derive submit disabled state: mutation pending OR overlap OR travel_gap pending confirmation
  const isSubmitDisabled = mutation.isPending || !!(formConflict && (formConflict.type === 'overlap' || formConflict.type === 'travel_gap'));

  // Proactive conflict check with debounce
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const shouldCheck = !!watchedProfessional && !!watchedDate && !!watchedStart && !!watchedEnd;
    if (!shouldCheck) {
      setFormConflict(null);
      return () => { mounted = false; };
    }

    timer = setTimeout(async () => {
      try {
        const payload: { event_date: string; start_time: string; end_time: string; professional: string; excludeId?: string } = {
          event_date: watchedDate,
          start_time: watchedStart,
          end_time: watchedEnd,
          professional: watchedProfessional,
        };
        if (isEditMode) payload.excludeId = eventId;
        const { data } = await api.post('/events/check-conflicts', payload);
        if (!mounted) return;
        const { overlapConflicts = [], travelConflicts = [] } = data || {};
        if (overlapConflicts && overlapConflicts.length > 0) {
          setFormConflict({ type: 'overlap', message: renderOverlapMessage(overlapConflicts), conflicts: overlapConflicts });
        } else if (travelConflicts && travelConflicts.length > 0) {
          setFormConflict({ type: 'travel_gap', message: `Intervalo de deslocamento insuficiente (menos de ${TRAVEL_GAP_MINUTES} minutos) entre locais diferentes.`, conflicts: travelConflicts });
          setTravelConflicts(travelConflicts);
        } else {
          setFormConflict(null);
        }
      } catch (err) {
        // On error, avoid blocking the form; clear conflicts and let server-side handle on submit
        console.debug('Conflict check failed', err);
        setFormConflict(null);
      } finally {
        // no-op
      }
    }, 400);

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [watchedProfessional, watchedDate, watchedStart, watchedEnd, isEditMode, eventId]);

  if (isLoadingEvent) return <p>Carregando evento...</p>;

  return (
    <FormProvider {...methods}>
      <PageContainer>
        <PageTitle>{isEditMode ? 'Editar Evento' : 'Novo Evento'}</PageTitle>
        <FormContainer>
          <FormTitle>{isEditMode ? 'Ajuste os Detalhes' : 'Criar Evento'}</FormTitle>
          <Form onSubmit={handleSubmit(onFormSubmit)}>
            <FieldGroup>
              <label>Tipo de Evento</label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select
                  {...field}
                  options={typeOptions}
                  value={typeOptions.find(c => c.value === field.value)}
                  onChange={val => field.onChange(val?.value)}
                  placeholder="Selecione o tipo..."
                />
              )} />
              {errors.type && <ErrorMessage>{errors.type.message}</ErrorMessage>}
              {/* Checkbox de instruções */}
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={showInstructions}
                    onChange={e => {
                      setShowInstructions(e.target.checked);
                      setValue('instructions', e.target.checked ? '' : undefined);
                    }}
                  />
                  Instruções
                </label>
                {/* Campo de instruções aparece se checkbox marcado */}
                {showInstructions && (
                  <div style={{ marginTop: 8 }}>
                    <Input
                      type="text"
                      maxLength={50}
                      placeholder="Ex: Jejum de 24h, ir acompanhado..."
                      {...register('instructions')}
                    />
                    <span style={{ fontSize: 12, color: '#666' }}>{watch('instructions')?.length || 0}/50 caracteres</span>
                    {errors.instructions && <ErrorMessage>{errors.instructions.message}</ErrorMessage>}
                  </div>
                )}
              </div>
            </FieldGroup>

            <FieldGroup>
              <label>Profissional</label>
              <ProfessionalControl>
                <ProfessionalSelectWrapper>
                  <Controller name="professional" control={control} render={({ field }) => (
                    <Select
                      options={professionalOptionsWithAdd}
                      isLoading={isLoadingProfessionals}
                      isClearable
                      isSearchable
                      placeholder="Selecione ou digite..."
                      value={professionalOptions.find(c => c.value === field.value)}
                      onChange={handleProfessionalChange}
                      styles={{ option: (base, { data }) => (data.isFixed ? { ...base, fontStyle: 'italic', color: '#007BFF' } : base) }}
                    />
                  )} />
                </ProfessionalSelectWrapper>
                <NewButton type="button" onClick={() => setProfessionalModalOpen(true)}>Novo</NewButton>
              </ProfessionalControl>
              {errors.professional && <ErrorMessage>{errors.professional.message}</ErrorMessage>}
            </FieldGroup>

            <FieldGroup>
              <label>Data do Evento</label>
              <Controller name="event_date" control={control} render={({ field }) => {
                let selectedDate: Date | null = null;
                try {
                  if (field.value) {
                    const d = new Date(field.value + 'T00:00:00');
                    selectedDate = isNaN(d.getTime()) ? null : d;
                  }
                } catch {
                  selectedDate = null;
                }
                return (
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => field.onChange(date?.toISOString().split('T')[0])}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/aaaa"
                    locale="pt-BR"
                    customInput={<Input />}
                  />
                );
              }} />
              <DateHelperText>{formattedDayOfWeek}</DateHelperText>
              {/* Aviso para eventos passados */}
              {(() => {
                if (!watch || !watch('event_date')) return null;
                const today = new Date();
                const eventDate = new Date(watch('event_date') + 'T00:00:00');
                if (eventDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                  return (
                    <div style={{ color: '#b45309', fontSize: '0.95rem', marginTop: 4, background: '#fff7ed', border: '1px solid #fde68a', borderRadius: 6, padding: '0.5rem' }}>
                      <strong>Atenção:</strong> Eventos criados com data anterior à hoje não poderão ser editados ou deletados após criados.
                    </div>
                  );
                }
                return null;
              })()}
              {errors.event_date && <ErrorMessage>{errors.event_date.message}</ErrorMessage>}
            </FieldGroup>

            <Row>
              <FieldGroup>
                <label>Hora de Início</label>
                <Input type="time" {...register('start_time')} />
                {errors.start_time && <ErrorMessage>{errors.start_time.message}</ErrorMessage>}
              </FieldGroup>
              <FieldGroup>
                <label>Hora de Fim</label>
                <Input type="time" {...register('end_time')} />
                {errors.end_time && <ErrorMessage>{errors.end_time.message}</ErrorMessage>}
              </FieldGroup>
            </Row>
            {/* Inline conflict message (depois das horas e antes de Observação) */}
            {formConflict && (
              <div role="alert" aria-live="polite" style={{ marginTop: 8 }}>
                {formConflict.type === 'overlap' ? (
                  <ErrorMessage>{formConflict.message}</ErrorMessage>
                ) : (
                  <div style={{ background: '#fff4e5', border: '1px solid #ffd59e', padding: '0.75rem', borderRadius: 6 }}>
                    <strong>Atenção:</strong> {formConflict.message}
                    {formConflict.conflicts && formConflict.conflicts.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
                        {formConflict.conflicts.slice(0,3).map((c, idx) => (
                          <div key={idx} style={{ marginBottom: 4, fontSize: 13, color: '#333' }}>{renderConflictSummary(c as Record<string, unknown>)}</div>
                        ))}
                        {formConflict.conflicts.length > 3 && <div style={{ fontSize: 12, color: '#666' }}>Ver todos no modal...</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <FieldGroup>
              <label>Observação</label>
              <NotesWrapper>
                <NotesTextarea {...register('notes')} />
                <CharCounter>{notesValue.length}/500 caracteres</CharCounter>
              </NotesWrapper>
              {errors.notes && <ErrorMessage>{errors.notes.message}</ErrorMessage>}
            </FieldGroup>

            {/* REMOVIDO: Toda a lógica de recorrência foi retirada deste formulário */}

            <Button type="submit" disabled={isSubmitDisabled}>
              {isEditMode ? 'Atualizar Evento' : 'Criar Evento'}
            </Button>
          </Form>
        </FormContainer>
        <Footer>© 2025 Omni Saúde</Footer>
      </PageContainer>

      <ProfessionalFormModal isOpen={isProfessionalModalOpen} onClose={() => setProfessionalModalOpen(false)} onSuccess={handleProfessionalSuccess} />

      <Modal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)}>
        <h2>Revisar Evento</h2>
        {formData && (
          <div>
            <p><strong>Tipo:</strong> {formData.type}</p>
            <p><strong>Profissional:</strong> {formData.professional}</p>
            <p><strong>Data:</strong> {new Date(formData.event_date + 'T00:00:00').toLocaleDateString()}</p>
            <p><strong>Horário:</strong> {formData.start_time} - {formData.end_time}</p>
            <p><strong>Observações:</strong> {formData.notes || 'Nenhuma'}</p>
          </div>
        )}
        <ModalActions>
          <Button onClick={() => setReviewModalOpen(false)} style={{ backgroundColor: '#808080' }}>Corrigir</Button>
          <Button onClick={handleConfirmAction} disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Confirmar'}
          </Button>
        </ModalActions>
      </Modal>
      {/* Modal específico para confirmar override de deslocamento */}
      <Modal isOpen={isTravelConfirmOpen} onClose={() => setTravelConfirmOpen(false)}>
        <div style={{ padding: '1rem' }}>
          <h3>Conflito de deslocamento detectado</h3>
          <p>Foram detectados eventos próximos que não garantem o intervalo de 60 minutos entre locais diferentes. Mesmo assim, deseja prosseguir?</p>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {travelConflicts?.map((c: Record<string, unknown>) => (
              <div key={String(c['id'])} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
                <div style={{ fontSize: 13, color: '#333' }}>{renderConflictSummary(c)}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Endereço: {String(c['address'] || '—')}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: '1rem', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setTravelConfirmOpen(false)} style={{ backgroundColor: '#808080' }}>Cancelar</Button>
            <Button onClick={handleConfirmTravelOverride}>Confirmar mesmo assim</Button>
          </div>
        </div>
      </Modal>
    </FormProvider>
  );
}
