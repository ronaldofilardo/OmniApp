import { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Archive, PencilSimple, Trash, ShareNetwork, CloudArrowUp, Paperclip, Clipboard, Bell } from 'phosphor-react';

import { Modal } from './Modal';
import { useToast } from './useToast';
import { Button } from './Button';
import { api } from '../services/api';
import { ManageFilesModal } from './ManageFilesModal';
import { ShareFilesModal } from './ShareFilesModal';
import type { TimelineItem } from '../types/timeline';

// Utilitário para extrair mensagem segura de erro
function safeErrorMessage(err: unknown, fallback = 'Erro') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = err as any;
    return anyErr?.response?.data?.message || anyErr?.message || fallback;
  } catch {
    return fallback;
  }
}

// Usamos o tipo compartilhado TimelineItem de src/types/timeline

// Styled Components

interface CardContainerProps {
  $position: 'left' | 'right';
  $status: 'pending' | 'confirmed' | 'skipped';
}

const CardContainer = styled.div<CardContainerProps>`
  position: relative;
  width: calc(50% - 2.5rem); 
  padding: 1rem;
  border-radius: 8px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  
  ${({ $position }) => $position === 'left' ? css`
    align-self: flex-start;
    margin-left: 1.5rem;
  ` : css`
    align-self: flex-end;
    margin-right: 1.5rem;
  `}

  ${({ $status }) => $status === 'confirmed' && css`
    background-color: #F0FFF4; // Verde claro
    border-color: #A7F3D0;
  `}

  ${({ $status }) => $status === 'skipped' && css`
    background-color: #FFF5F5; // Vermelho claro
    border-color: #FFCDD2;
    opacity: 0.7;
  `}

  &::after {
    content: '';
    position: absolute;
    top: 1rem;
    width: 0;
    height: 0;
    border-style: solid;
    
    ${({ $position, $status }) => {
      let pointerColor = '#fff';
  if ($status === 'confirmed') pointerColor = '#F0FFF4';
  if ($status === 'skipped') pointerColor = '#FFF5F5';
      
      return $position === 'left' ? css`
        right: -0.75rem;
        border-width: 8px 0 8px 8px;
        border-color: transparent transparent transparent ${pointerColor};
      ` : css`
        left: -0.75rem;
        border-width: 8px 8px 8px 0;
        border-color: transparent ${pointerColor} transparent transparent;
      `
    }}
  }

  @media (max-width: 768px) {
    width: calc(100% - 3.5rem);
    align-self: flex-end;
    margin: 0 0 0 1.5rem;

    &::after {
      left: -0.75rem;
      right: auto;
      border-width: 8px 8px 8px 0;
      border-color: transparent;
      
      ${({ $status }) => {
        let pointerColor = '#fff';
  if ($status === 'confirmed') pointerColor = '#F0FFF4';
  if ($status === 'skipped') pointerColor = '#FFF5F5';
        return css`
          border-color: transparent ${pointerColor} transparent transparent;
        `;
      }}
    }
  }
`;

const CardHeader = styled.div`
  font-weight: bold;
  font-size: 1rem;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  border-top: 1px solid #eee;
  padding-top: 0.75rem;
`;

const ActionButton = styled.button<{ $hasFiles?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: 1px solid transparent;
  color: #555;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;

  &:hover:not(:disabled) {
    color: #000;
    background-color: #f0f0f0;
  }

  ${props => props.$hasFiles && css`
    background-color: rgba(0,123,255,0.08);
    color: #007bff;
    border-color: rgba(0,123,255,0.2);

    &:hover:not(:disabled) {
      background-color: rgba(0,123,255,0.12);
    }
  `}
`;

// Componente span sem props customizadas para evitar warnings do React
const ActionSpan = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: 1px solid transparent;
  color: #555;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;

  &:hover:not(:disabled) {
    color: #000;
    background-color: #f0f0f0;
  }
`;

// ...existing code...

interface EventCardProps {
  item: TimelineItem;
  position: 'left' | 'right';
  // Indica se o card está atualmente ativo/selecionado na timeline
  isActive?: boolean;
  // Callback opcional para selecionar o card
  onSelect?: (occurrenceId: string) => void;
  notificationInfo?: { total: number; unread: number } | null;
}

const ShortcutButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: ${({ theme }) => theme.colors['primary-blue'] || '#007bff'};
  color: #fff;
  border: none;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  font-size: 0.8rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  z-index: 5;
`;

export function EventCard({ item, position, isActive = false, onSelect, notificationInfo = null }: EventCardProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isFilesModalOpen, setFilesModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  // Confirmação de ocorrência foi descontinuada: botões removidos

  const isPontual = !item.is_recurrent;
  // Tenta construir timestamps precisos para início e fim da ocorrência.
  let startMillis = NaN;
  let endMillis = NaN;
  if (item.occurrence_timestamp) {
    const ts = item.occurrence_timestamp;
    // Se já contém hora (ISO), usa diretamente como início
    if (ts.includes('T')) {
      startMillis = Date.parse(ts);
    } else {
      // Ts pode ser só a data (YYYY-MM-DD). Se tivermos start_time, combine como YYYY-MM-DDThh:mm
      if (item.start_time) {
        const timePart = item.start_time.length >= 5 ? item.start_time.substring(0,5) : item.start_time;
        startMillis = Date.parse(`${ts}T${timePart}`);
        if (isNaN(startMillis)) startMillis = Date.parse(`${ts}T${timePart}:00`);
      } else {
        startMillis = Date.parse(ts);
      }
    }
    if (isNaN(startMillis)) console.warn('Não foi possível parsear occurrence_timestamp:', item.occurrence_timestamp, 'start_time:', item.start_time);
  } else {
    // Fallback: alguns endpoints retornam apenas event_date/date + start_time (sem occurrence_timestamp)
    const dateOnly = (item.event_date || item.date || '').toString();
    if (dateOnly) {
      if (item.start_time) {
        const timePart = item.start_time.length >= 5 ? item.start_time.substring(0,5) : item.start_time;
        startMillis = Date.parse(`${dateOnly}T${timePart}`);
        if (isNaN(startMillis)) startMillis = Date.parse(`${dateOnly}T${timePart}:00`);
      } else {
        startMillis = Date.parse(dateOnly);
      }
      if (isNaN(startMillis)) console.warn('Não foi possível parsear event_date/date:', dateOnly, 'start_time:', item.start_time);
    }
  }
  const nowMs = Date.now();

  // Determina endMillis com preferência por end_time quando disponível
  if (item.end_time && (item.occurrence_timestamp || item.event_date || item.date)) {
    const baseDate = item.occurrence_timestamp && item.occurrence_timestamp.includes('T') ? item.occurrence_timestamp.substring(0,10) : (item.event_date || item.date || '');
    const timePart = item.end_time.length >= 5 ? item.end_time.substring(0,5) : item.end_time;
    if (baseDate) {
      endMillis = Date.parse(`${baseDate}T${timePart}`);
      if (isNaN(endMillis)) endMillis = Date.parse(`${baseDate}T${timePart}:00`);
    }
  } else if (item.occurrence_timestamp && item.occurrence_timestamp.includes('T')) {
    // fallback: if occurrence_timestamp already had time, use it as end too
    endMillis = Date.parse(item.occurrence_timestamp);
  }

  // Estados derivados:
  // - isBeforeStart: agora ainda é anterior ao início => edição/deleção habilitadas
  // - isInProgress: entre início (inclusive) e fim (exclusive) => desabilitar
  // - isPastEvent: após o fim (ou, se não houver fim, após o início) => desabilitar
  const isBeforeStart = !isNaN(startMillis) ? startMillis > nowMs : false;
  const isInProgress = (!isNaN(startMillis) && !isNaN(endMillis)) ? (startMillis <= nowMs && nowMs < endMillis) : false;
  // isPastEvent/handlePastEditAttempt foram removidos pois eventos repetitivos não existem mais
  const { data: files } = useQuery({
    queryKey: ['eventFiles', item.id],
    queryFn: () => api.get(`/events/${item.id}/files`).then(res => res.data),
  });

  const { data: professionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => api.get('/professionals').then(res => res.data),
  });

  // Escutar evento global para abrir modal de arquivos (disparado pela notificação)
  useEffect(() => {
    const onOpen = (e: Event) => {
      const ce = e as CustomEvent;
      if (!ce?.detail || !ce.detail.eventId) return;
      if (ce.detail.eventId === item.id) {
        setFilesModalOpen(true);
      }
    };
    window.addEventListener('openFilesModal', onOpen as EventListener);
    return () => { window.removeEventListener('openFilesModal', onOpen as EventListener); };
  }, [item.id]);

  const professionalDetails = Array.isArray(professionals) ? professionals.find((p: { name: string; specialty?: string; address?: string; contact?: string }) => p.name === item.professional) : null;

  const hasFiles = Array.isArray(files) && files.length > 0;
  const hasUnviewedFiles = Array.isArray(files) && files.some((f: { viewed_at?: string | null }) => !f.viewed_at);

  // Novo utilitário: obtém a faixa de horário em formato 'HH:MM - HH:MM' ou 'HH:MM'
  const getTimeRange = () => {
    // Priorizar start_time/end_time quando presentes
    const extractHM = (v?: string) => {
      if (!v) return '';
      // Se for ISO (contains 'T'), extrair parte hora
      if (v.includes('T')) {
        const parts = v.split('T');
        const timePart = parts[1].substring(0,5);
        return timePart;
      }
      // Se for 'HH:MM:SS' ou 'HH:MM'
      if (v.length >= 5 && /\d{2}:\d{2}/.test(v.substring(0,5))) return v.substring(0,5);
      const m = v.match(/(\d{2}:\d{2})/);
      return m ? m[1] : '';
    };

    const start = extractHM(item.start_time || item.occurrence_timestamp || item.date || item.event_date);
    let end = '';
    if (item.end_time) end = extractHM(item.end_time);
    // Se end for igual a start ou vazio, não mostrar o range
    if (!start) return '';
    return end && end !== start ? `${start} - ${end}` : `${start}`;
  };

  return (
    <>
  <CardContainer $position={position} $status={item.status} onClick={() => onSelect?.(item.occurrence_id)} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
    {isActive && (
      <ShortcutButton onClick={(e) => { e.stopPropagation(); setFilesModalOpen(true); }} title="Receber Documento">
        <CloudArrowUp size={14} /> Receber
        {hasUnviewedFiles && <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#dc3545', color: 'white', borderRadius: '50%', width: '8px', height: '8px', fontSize: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
      </ShortcutButton>
    )}
        <CardHeader>
          <span>{`${item.type} - ${item.professional}${getTimeRange() ? ' - ' + getTimeRange() : ''}`}</span>
          {/* Mostrar sininho somente se houver notificação associada ao evento */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {notificationInfo && notificationInfo.total > 0 ? (
              <div
                title={notificationInfo.unread > 0 ? `${notificationInfo.total} notificação(ões) · ${notificationInfo.unread} não visualizada(s)` : `${notificationInfo.total} notificação(ões)`}
                style={{ color: notificationInfo.unread > 0 ? '#ffc107' : '#007bff', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
              >
                <Bell size={18} weight={notificationInfo.unread > 0 ? 'fill' : 'regular'} />
              </div>
            ) : (
              <div style={{ color: '#9ca3af', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }} title="Sem notificações">
                <Bell size={18} weight="regular" />
              </div>
            )}

            {notificationInfo && notificationInfo.unread > 0 && (
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc3545', color: 'white', borderRadius: '50%', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>!</span>
              </div>
            )}
          </div>
        </CardHeader>
        {/* Endereço/Local do profissional */}
        {professionalDetails?.address && (
          <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.5rem' }}>
            📍 {professionalDetails.address}
          </div>
        )}
        {/* Instruções do evento */}
        {item.instructions && (
          <div style={{ fontSize: '0.95rem', color: '#1d4ed8', marginBottom: 8, background: '#eef2ff', borderRadius: 6, padding: '0.5rem' }}>
            <strong>Instruções:</strong> {item.instructions}
          </div>
        )}
        {/* Ações condicionais */}
        {isPontual ? (
          <CardActions>
            <ActionButton onClick={() => setViewModalOpen(true)}><Eye size={16} /> Visualizar</ActionButton>
            <ActionButton $hasFiles={hasFiles} onClick={() => setFilesModalOpen(true)}>{hasFiles ? <Paperclip size={16} /> : <Archive size={16} />} Arquivos</ActionButton>
            <ActionButton onClick={() => setShareModalOpen(true)}><ShareNetwork size={16} /> Compartilhar</ActionButton>
            {(
              // Mostrar os botões sempre, mas habilitar apenas quando o evento estiver no futuro (antes do início)
              // Durante execução ou após término, os botões aparecem desabilitados com tooltip explicativo.
              <>
                {isBeforeStart ? (
                  <Link to={`/events/edit/${item.id}`} style={{ textDecoration: 'none' }}>
                    <ActionSpan title="Editar"><PencilSimple size={16} /> Editar</ActionSpan>
                  </Link>
                ) : (
                  <ActionSpan title={isInProgress ? 'Evento em execução — não é possível editar' : 'Evento já ocorreu — não é possível editar'} style={{opacity: 0.5, cursor: 'not-allowed'}}>
                    <PencilSimple size={16} /> Editar
                  </ActionSpan>
                )}
                {isBeforeStart ? (
                  <ActionButton title="Deletar" onClick={async () => {
                    const confirmed = window.confirm('Deseja realmente deletar este evento? Esta ação marcará o evento como deletado e os arquivos associados serão movidos para o repositório como órfãos.');
                    if (!confirmed) return;
                    try {
                      await api.delete(`/events/${item.id}`);
                      queryClient.invalidateQueries({ queryKey: ['timeline'] });
                      queryClient.invalidateQueries({ queryKey: ['repository-files'] });
                      toast.show('Evento deletado com sucesso. Arquivos foram movidos para o repositório como órfãos.', 'success');
                    } catch (err) {
                      toast.show(safeErrorMessage(err, 'Falha ao deletar evento.'), 'error');
                    }
                  }}><Trash size={16} /> Deletar</ActionButton>
                ) : (
                  <ActionSpan title={isInProgress ? 'Evento em execução — não é possível deletar' : 'Evento já ocorreu — não é possível deletar'} style={{opacity: 0.5, cursor: 'not-allowed'}}>
                    <Trash size={16} /> Deletar
                  </ActionSpan>
                )}
              </>
            )}
          </CardActions>
        ) : (
          <CardActions>
            {/* Eventos repetitivos removidos — não há ação para séries */}
          </CardActions>
        )}

        {/* Confirmar / Pular removidos conforme solicitado */}
      </CardContainer>

      {isFilesModalOpen && (
        <ManageFilesModal 
          isOpen={isFilesModalOpen}
          onClose={() => setFilesModalOpen(false)}
          eventId={item.id}
          occurrenceTimestamp={item.occurrence_timestamp}
        />
      )}
      {isShareModalOpen && (
        <ShareFilesModal
          isOpen={isShareModalOpen}
          onClose={() => setShareModalOpen(false)}
          eventId={item.id}
        />
      )}
      {isViewModalOpen && (
        <Modal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)}>
          <div style={{ padding: '1.5rem', maxWidth: 600 }}>
            <h3 style={{ marginTop: 0 }}>{item.type}</h3>
            <p><strong>Profissional:</strong> {item.professional}</p>
            {professionalDetails && (
              <div style={{ marginBottom: '0.5rem' }}>
                <p style={{ margin: 0 }}><strong>Especialidade:</strong> {professionalDetails.specialty}</p>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>Endereço:</strong>
                  <span>{professionalDetails.address || '—'}</span>
                  {professionalDetails.address && (
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { navigator.clipboard?.writeText(professionalDetails.address); toast.show('Endereço copiado!', 'success'); }} title="Copiar endereço"><Clipboard size={16} /></button>
                  )}
                </p>
                {professionalDetails.contact && <p style={{ margin: 0 }}><strong>Contato:</strong> {professionalDetails.contact}</p>}
              </div>
            )}
            <p><strong>Horário:</strong> {item.start_time}{item.end_time ? ` - ${item.end_time}` : ''}</p>
            {item.notes && <p><strong>Notas:</strong> {item.notes}</p>}
            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <Button onClick={() => setViewModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
