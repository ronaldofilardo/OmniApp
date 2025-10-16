import { useMemo } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Info } from 'phosphor-react';

import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { FileSlot } from '../components/FileSlot';

// --- Tipagem ---
interface EventFile {
  id: string;
  file_name: string;
  file_type: string;
  url?: string | null;
}

interface Event {
  id: string;
  type: string;
  professional: string;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  deleted_at?: string | null;
  files: EventFile[];
}

// --- Styled Components ---
const PageContainer = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
`;

const SummaryBox = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2.5rem;
  font-size: 0.9rem;
  color: #333;
`;

const EventGroup = styled.div`
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
`;

const EventInfo = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
`;

const EventDate = styled.p`
  font-size: 0.9rem;
  color: #777;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const SlotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`;

// --- Constantes e Funções ---
const FILE_TYPES = [
  { type: 'Requisicao', label: 'Requisição' },
  { type: 'Autorizacao', label: 'Autorização' },
  { type: 'Atestado', label: 'Atestado' },
  { type: 'Prescricao', label: 'Prescrição' },
  { type: 'LaudoResultado', label: 'Laudo/Resultado' },
  { type: 'NotaFiscal', label: 'Nota Fiscal' },
];

const fetchRepositoryEvents = async (): Promise<{ events: (Event & { files: EventFile[] })[]; orphans: EventFile[] }> => {
  // Buscamos todos os eventos do repositório (inclui deletados)
  const { data: events } = await api.get('/repository/events');
  const eventsWithFiles = await Promise.all(
    events.map(async (event: Event) => {
      const { data: files } = await api.get(`/events/${event.id}/files`);
      return { ...event, files } as Event & { files: EventFile[] };
    })
  );

  // Também trazemos órfãos que eventualmente não estejam ligados a um evento
  const { data: orphans } = await api.get('/repository/orphans');
  return { events: eventsWithFiles, orphans };
};

// --- Componente Principal ---
export function FilesRepositoryPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['repository-events'],
    queryFn: fetchRepositoryEvents,
  });
  const events = useMemo(() => data?.events || [], [data?.events]);
  const orphans = useMemo(() => data?.orphans || [], [data?.orphans]);

  // Agrupar por data (YYYY-MM-DD) e ordenar as chaves de data da maior para a menor
  const groupedByDate = useMemo(() => {
    const groups: Record<string, (Event & { files: EventFile[] })[]> = {};
    (events || []).forEach(ev => {
      const key = ev.event_date || '';
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    // Ordenar eventos dentro da mesma data por start_time asc (opcional)
    Object.keys(groups).forEach(k => {
      groups[k].sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')));
    });
    // Retornar um array de pares [date, events] ordenado por date desc
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(d => ({ date: d, events: groups[d] }));
  }, [events]);

  const filesSummary = useMemo(() => {
    if (!events) return 'Calculando...';
    
    const allFiles = events.flatMap(event => event.files).concat(orphans || []);
    const totalFiles = allFiles.length;
    if (totalFiles === 0) return 'Nenhum documento no repositório.';

    const countByType = allFiles.reduce((acc, file) => {
      const label = FILE_TYPES.find(ft => ft.type === file.file_type)?.label || 'Outro';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summaryString = Object.entries(countByType)
      .map(([label, count]) => `${count} ${label}(s)`)
      .join(' • ');

    return `Total: ${totalFiles} documento(s) (${summaryString})`;
  }, [events, orphans]);

  if (isLoading) return <p>Carregando repositório...</p>;

  return (
    <PageContainer>
      <Title>Repositório de Arquivos</Title>
      
      <SummaryBox>
        <Info size={24} color="#096dd9" />
        <p>{filesSummary}</p>
      </SummaryBox>
      
      {groupedByDate.map(({ date, events: evs }) => (
        <div key={date}>
          <EventDate>{format(parseISO(date), "dd/MM/yyyy - EEEE", { locale: ptBR })}</EventDate>
          {evs.map(event => (
            <EventGroup key={event.id}>
              <EventHeader>
                <EventInfo>{`${event.type} - ${event.professional}${event.start_time ? ` - ${String(event.start_time).slice(0,5)}${event.end_time ? ` - ${String(event.end_time).slice(0,5)}` : ''}` : ''}`}</EventInfo>
              </EventHeader>
              <SlotsGrid>
                {FILE_TYPES.map(({ type, label }) => {
                  const fileData = event.files.find(f => f.file_type === type);
                  return (
                    <FileSlot
                      key={type}
                      eventId={event.id}
                      fileType={type}
                      fileLabel={label}
                      fileData={fileData}
                    />
                  );
                })}
              </SlotsGrid>
            </EventGroup>
          ))}
        </div>
      ))}

      {/* Seção: eventos marcados como DELETADOS */}
      {events.filter(e => !!e.deleted_at).length > 0 && (
        <EventGroup>
          <EventHeader>
            <EventInfo>Eventos Deletados</EventInfo>
          </EventHeader>
          <EventDate>Eventos removidos da timeline — confirme exclusão dos arquivos ou restaure o evento.</EventDate>
          <SlotsGrid>
            {events.filter(e => !!e.deleted_at).map((evt) => (
              <div key={evt.id} style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: 8, background: '#fff' }}>
                <p style={{ fontWeight: 600 }}>{evt.type} - {evt.professional}</p>
                <p style={{ fontSize: 12, color: '#666' }}>{new Date(evt.event_date).toLocaleString()}</p>
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <a href="#" onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const { data: files } = await api.get<EventFile[]>(`/events/${evt.id}/files`);
                      alert('Arquivos:\n' + files.map((f) => `- ${f.file_name} (${f.file_type})`).join('\n'));
                    } catch (error) {
                      console.error('Falha ao buscar arquivos do evento', error);
                      alert('Falha ao buscar arquivos do evento.');
                    }
                  }}>Ver arquivos</a>
                  <button onClick={async () => {
                    if (!window.confirm('Deseja restaurar este evento na timeline?')) return;
                    try {
                      await api.post(`/repository/events/${evt.id}/restore`);
                      await queryClient.invalidateQueries({ queryKey: ['repository-events'] });
                    } catch (error) {
                      console.error('Falha ao restaurar evento', error);
                      alert('Falha ao restaurar evento.');
                    }
                  }}>Restaurar</button>
                  <button onClick={async () => {
                    if (!window.confirm('Deseja deletar permanentemente os arquivos e remover o evento do repositório? Esta ação é irreversível.')) return;
                    try {
                      await api.post(`/repository/events/${evt.id}/confirm-delete`);
                      await queryClient.invalidateQueries({ queryKey: ['repository-events'] });
                    } catch (error) {
                      console.error('Falha ao deletar permanentemente', error);
                      alert('Falha ao deletar permanentemente.');
                    }
                  }}>Deletar permanentemente</button>
                </div>
              </div>
            ))}
          </SlotsGrid>
        </EventGroup>
      )}

      {/* Seção de arquivos órfãos soltos (sem event_id) */}
      {orphans.length > 0 && (
        <EventGroup>
          <EventHeader>
            <EventInfo>Arquivos Órfãos</EventInfo>
          </EventHeader>
          <EventDate>Arquivos sem evento associado — disponíveis no repositório</EventDate>
          <SlotsGrid>
            {orphans.map((file: EventFile) => {
              // URL sem token - acesso livre
              const apiBaseUrl = api.defaults.baseURL || 'http://localhost:3333';
              const viewUrl = file.url || `${apiBaseUrl}/files/${file.id}/view`;
              return (
                <div key={file.id} style={{ border: '1px solid #eee', padding: '0.75rem', borderRadius: 8, background: '#fff' }}>
                  <p style={{ fontWeight: 600 }}>{file.file_name}</p>
                  <p style={{ fontSize: 12, color: '#666' }}>Tipo: {file.file_type || '—'}</p>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <a href={viewUrl} target="_blank" rel="noreferrer">Visualizar</a>
                    <button onClick={async () => {
                      if (!window.confirm('Deseja apagar este arquivo permanentemente do repositório?')) return;
                      try {
                        await api.delete(`/files/${file.id}`);
                        await queryClient.invalidateQueries({ queryKey: ['repository-events'] });
                      } catch (err: unknown) {
                        console.error('Falha ao deletar arquivo órfão:', err);
                        alert('Falha ao deletar arquivo.');
                      }
                    }}>Deletar permanentemente</button>
                  </div>
                </div>
              );
            })}
          </SlotsGrid>
        </EventGroup>
      )}
    </PageContainer>
  );
}
