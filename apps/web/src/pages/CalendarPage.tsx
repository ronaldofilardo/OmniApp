import { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, FilePdf } from 'phosphor-react';

import { api } from '../services/api';
import { type Event } from '../store/event.store';
import { Button } from '../components/Button';
import { useToast } from '../components/useToast';

registerLocale('pt-BR', ptBR);

// --- Styled Components ---
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 1rem auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #555;
  text-decoration: none;
  &:hover {
    color: #000;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
`;

const CalendarLayout = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  align-items: flex-start;

  @media (max-width: 992px) {
    grid-template-columns: 1fr; // Muda para coluna única em telas menores
  }
`;

const CalendarContainer = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const EventsContainer = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  min-height: 400px;
`;

const EventsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const EventsTitle = styled.h2`
  font-size: 1.25rem;
  text-transform: capitalize;
`;

const ExportButton = styled(Button)`
  width: auto;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EventList = styled.ul`
  list-style: none;
  padding: 0;
`;

const EventItem = styled.li`
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
`;

const EventType = styled.p`
  font-weight: bold;
  color: #333;
`;

// const EventDetails = styled.p` // removido: não utilizado
//   font-size: 0.9rem;
//   color: #666;
// `;

const ViewModeContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ViewModeButton = styled.button<{ isActive: boolean }>`
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  border: 1px solid ${({ theme, isActive }) => (isActive ? theme.colors['feedback-success'] : theme.colors.border)};
  background-color: ${({ theme, isActive }) => (isActive ? theme.colors['feedback-success'] : '#fff')};
  color: ${({ isActive }) => (isActive ? '#fff' : '#333')};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover:not(:disabled) {
    opacity: 0.8;
  }
`;

// --- Lógica do Componente ---

type ViewMode = 'day' | 'week' | 'month';

const fetchEventsByPeriod = async (startDate: string, endDate: string): Promise<Event[]> => {
  const { data } = await api.get('/events/by-period', {
    params: { startDate, endDate }
  });
  return data;
};

export function CalendarPage() {
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const { period, title } = useMemo(() => {
    let start, end, periodTitle;
    switch (viewMode) {
      case 'day':
        start = selectedDate;
        end = selectedDate;
        periodTitle = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        break;
      case 'week':
        start = startOfWeek(selectedDate, { locale: ptBR });
        end = endOfWeek(selectedDate, { locale: ptBR });
        periodTitle = `Semana de ${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`;
        break;
      case 'month':
      default:
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
        periodTitle = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
        break;
    }
    return {
      period: {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      },
      title: periodTitle,
    };
  }, [selectedDate, viewMode]);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', period],
    queryFn: () => fetchEventsByPeriod(period.startDate, period.endDate),
  });

  // professionals hook removido: endpoint /events/by-period já retorna professional_address/contact

  const { data: monthEventsForHighlight } = useQuery({
    queryKey: ['events', { month: format(currentDate, 'yyyy-MM') }],
    queryFn: () => fetchEventsByPeriod(
      format(startOfMonth(currentDate), 'yyyy-MM-dd'),
      format(endOfMonth(currentDate), 'yyyy-MM-dd')
    ),
  });

  const handleExportPdf = async () => {
    if (!events || events.length === 0) {
      toast.show('Não há eventos para exportar.', 'info');
      return;
    }
    try {
      const response = await api.post('/events/export-pdf', 
        { events, period: title },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Relatorio-${title.replace(/ /g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.show('Erro ao exportar PDF.', 'error');
    }
  };

  return (
    <PageContainer>
      <Header>
        <BackLink to="/timeline"><ArrowLeft size={20} /> Voltar para a Timeline</BackLink>
      </Header>
      <Title>Calendário</Title>

      <CalendarLayout>
        <CalendarContainer>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && setSelectedDate(date)}
            locale="pt-BR"
            inline
            onMonthChange={(date) => setCurrentDate(date)}
            highlightDates={monthEventsForHighlight?.map(e => {
              const raw = e.event_date;
              if (!raw) return new Date('');
              if (typeof raw === 'string' && raw.includes('T')) return new Date(raw);
              return new Date(raw + 'T00:00:00');
            })}
          />
          <ViewModeContainer>
            <ViewModeButton 
              isActive={viewMode === 'week'} 
              onClick={() => setViewMode('week')}
            >
              Semana
            </ViewModeButton>
            <ViewModeButton 
              isActive={viewMode === 'month'} 
              onClick={() => setViewMode('month')}
            >
              Mês
            </ViewModeButton>
          </ViewModeContainer>
        </CalendarContainer>

        <EventsContainer>
          <EventsHeader>
            <EventsTitle>Eventos - {title}</EventsTitle>
            <ExportButton onClick={handleExportPdf} disabled={!events || events.length === 0}>
              <FilePdf size={18} /> Exportar PDF
            </ExportButton>
          </EventsHeader>
          {isLoading ? (
            <p>Carregando eventos...</p>
          ) : events && events.length > 0 ? (
            <EventList>
              {(viewMode === 'day'
                ? events.filter(event => {
                    const raw = event.event_date;
                    if (!raw) return false;
                    // Extrai yyyy-MM-dd de event_date e selectedDate para comparar sem timezone
                    const eventDateStr = typeof raw === 'string' && raw.includes('T')
                      ? raw.slice(0,10)
                      : raw;
                    const selectedDateStr = selectedDate.toISOString().slice(0,10);
                    return eventDateStr === selectedDateStr;
                  })
                : events
              ).map(event => (
                <EventItem key={event.id}>
                  <EventType>{event.type} - {event.professional}</EventType>
                  {/* Endereço/local na segunda linha */}
                  <div style={{ fontSize: '0.95rem', color: '#555', marginBottom: '0.25rem' }}>
                    {event.professional_address || 'Endereço não informado'}
                  </div>
                  {/* Data e horário na terceira linha */}
                  <div style={{ fontSize: '0.95rem', color: '#333', marginBottom: '0.25rem' }}>
                    {(() => {
                      const datePart = typeof event.event_date === 'string' && event.event_date.includes('T')
                        ? event.event_date.slice(0, 10)
                        : event.event_date;
                      // Formata para dd-MM-yyyy
                      const [yyyy, mm, dd] = datePart.split('-');
                      const dateStr = `${dd}-${mm}-${yyyy}`;
                      // Extrai HH:MM de vários formatos possíveis
                      const extractTime = (v?: string) => {
                        if (!v) return '';
                        // ISO with 'T'
                        const m = v.match(/T(\d{2}:\d{2})/);
                        if (m && m[1]) return m[1];
                        // plain time like '20:15:00'
                        if (v.length >= 5 && /\d{2}:\d{2}/.test(v.substring(0,5))) return v.substring(0,5);
                        // fallback: try to parse time-like content
                        const m2 = v.match(/(\d{2}:\d{2})/);
                        return m2 ? m2[1] : '';
                      };
                      const startTime = extractTime(event.start_time);
                      const endTime = extractTime(event.end_time);
                      return `${dateStr} ${startTime}${endTime ? ` - ${endTime}` : ''}`;
                    })()}
                  </div>
                  {event.notes && (
                    <div style={{ fontSize: '0.95rem', color: '#666', marginBottom: '0.25rem' }}>
                      <strong>Obs:</strong> {event.notes}
                    </div>
                  )}
                  {event.instructions && (
                    <div style={{ fontSize: '0.95rem', color: '#1d4ed8', marginBottom: '0.25rem', background: '#eef2ff', borderRadius: 6, padding: '0.25rem' }}>
                      <strong>Instruções:</strong> {event.instructions}
                    </div>
                  )}
                </EventItem>
              ))}
            </EventList>
          ) : (
            <p>Não há eventos para o período selecionado.</p>
          )}
        </EventsContainer>
      </CalendarLayout>
    </PageContainer>
  );
}
