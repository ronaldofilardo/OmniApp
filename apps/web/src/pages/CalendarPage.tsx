import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, FilePdf, CaretLeft, CaretRight } from 'phosphor-react';

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
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.25rem !important;
    margin: 0.5rem auto !important;
  }
  @media (max-width: 480px) {
    padding: 0.15rem 0.05rem !important;
    margin: 0.15rem auto !important;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  @media (max-width: 480px) {
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #555;
  text-decoration: none;
  font-size: 1rem;
  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
  &:hover {
    color: #000;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const CalendarLayout = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  align-items: flex-start;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  @media (max-width: 768px) {
    gap: 1rem;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const CalendarContainer = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  @media (max-width: 480px) {
    padding: 0.5rem 0.2rem !important;
  }
`;

const CustomCalendar = styled.div`
  width: 100%;
  max-width: 350px;
  @media (max-width: 480px) {
    max-width: 100vw !important;
    margin-left: 0.05rem !important;
    margin-right: 0.05rem !important;
  }
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 1rem;
  @media (max-width: 480px) {
    padding: 0.5rem 0;
    margin-bottom: 0.5rem;
  }
`;

const MonthNavButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }
`;

const MonthYearTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  text-transform: capitalize;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const DayHeader = styled.div`
  padding: 0.5rem;
  text-align: center;
  font-weight: 500;
  font-size: 0.9rem;
  color: #666;
  background-color: #f8f9fa;
`;

const DayCell = styled.button<{ 
  isSelected?: boolean; 
  isToday?: boolean; 
  hasEvent?: boolean; 
  isOtherMonth?: boolean; 
}>`
  padding: 0.5rem;
  border: none;
  background: ${({ isSelected, hasEvent, isOtherMonth }) => 
    isSelected ? '#2196f3' : 
    hasEvent ? '#fff3e0' : 
    isOtherMonth ? '#f9f9f9' : 'white'};
  color: ${({ isSelected, isToday, isOtherMonth }) => 
    isSelected ? 'white' : 
    isToday ? '#2196f3' : 
    isOtherMonth ? '#ccc' : '#333'};
  cursor: pointer;
  border-radius: 4px;
  font-weight: ${({ isSelected, isToday }) => (isSelected || isToday) ? '600' : '400'};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: ${({ isSelected }) => isSelected ? '#1976d2' : '#e3f2fd'};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const EventsContainer = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  min-height: 400px;
  @media (max-width: 768px) {
    padding: 1rem;
    min-height: 300px;
  }
  @media (max-width: 480px) {
    padding: 0.5rem 0.2rem !important;
    min-height: 200px !important;
  }
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

// Função auxiliar para renderizar o calendário customizado
function renderCustomCalendar(
  currentDate: Date,
  selectedDate: Date,
  onDateSelect: (date: Date) => void,
  onMonthChange: (date: Date) => void,
  eventsInMonth: Event[] = []
) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = [];
  let currentDay = startDate;

  // Criar array de dias para o calendário
  while (currentDay <= endDate) {
    days.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  // Verificar se uma data tem eventos
  const hasEvents = (date: Date) => {
    return eventsInMonth.some(event => {
      const eventDate = event.event_date;
      if (!eventDate) return false;
      
      try {
        const eventDateObj = typeof eventDate === 'string' && eventDate.includes('T')
          ? new Date(eventDate)
          : new Date(eventDate + 'T00:00:00');
        
        return isSameDay(eventDateObj, date);
      } catch {
        return false;
      }
    });
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <CustomCalendar>
      <CalendarHeader>
        <MonthNavButton onClick={() => onMonthChange(subMonths(currentDate, 1))}>
          <CaretLeft size={16} />
        </MonthNavButton>
        <MonthYearTitle>
          {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </MonthYearTitle>
        <MonthNavButton onClick={() => onMonthChange(addMonths(currentDate, 1))}>
          <CaretRight size={16} />
        </MonthNavButton>
      </CalendarHeader>

      <CalendarGrid>
        {dayNames.map(day => (
          <DayHeader key={day}>{day}</DayHeader>
        ))}
        
        {days.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, startOfDay(new Date()));
          const hasEvent = hasEvents(day);
          const isOtherMonth = !isSameMonth(day, currentDate);

          return (
            <DayCell
              key={day.toISOString()}
              isSelected={isSelected}
              isToday={isToday}
              hasEvent={hasEvent}
              isOtherMonth={isOtherMonth}
              onClick={() => onDateSelect(day)}
            >
              {format(day, 'd')}
            </DayCell>
          );
        })}
      </CalendarGrid>
    </CustomCalendar>
  );
}

export function CalendarPage() {
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Garante que selectedDate acompanhe mudanças de mês quando necessário
  useEffect(() => {
    if (viewMode === 'month') {
      // Se selectedDate não está no mês atual mostrado, ajusta para o primeiro dia do mês
      if (selectedDate.getMonth() !== currentDate.getMonth() || 
          selectedDate.getFullYear() !== currentDate.getFullYear()) {
        const newSelectedDate = startOfMonth(currentDate);
        setSelectedDate(newSelectedDate);
      }
    }
  }, [currentDate, viewMode, selectedDate]);

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

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events', period, format(currentDate, 'yyyy-MM')],
    queryFn: () => fetchEventsByPeriod(period.startDate, period.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // professionals hook removido: endpoint /events/by-period já retorna professional_address/contact

  const { data: monthEventsForHighlight } = useQuery({
    queryKey: ['events-highlight', format(currentDate, 'yyyy-MM')],
    queryFn: () => fetchEventsByPeriod(
      format(startOfMonth(currentDate), 'yyyy-MM-dd'),
      format(endOfMonth(currentDate), 'yyyy-MM-dd')
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Função para alterar mês no calendário customizado
  const handleMonthChange = (newDate: Date) => {
    setCurrentDate(newDate);
    // No modo mês, também ajusta selectedDate para o primeiro dia do novo mês
    if (viewMode === 'month') {
      setSelectedDate(startOfMonth(newDate));
    }
  };

  // Função para selecionar data no calendário customizado
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Só atualiza currentDate se mudou o mês
    if (date.getMonth() !== currentDate.getMonth() || date.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(date);
    }
  };

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
          {renderCustomCalendar(
            currentDate,
            selectedDate,
            handleDateSelect,
            handleMonthChange,
            monthEventsForHighlight || []
          )}
          <ViewModeContainer>
            <ViewModeButton 
              isActive={viewMode === 'day'} 
              onClick={() => setViewMode('day')}
            >
              Dia
            </ViewModeButton>
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
          ) : error ? (
            <p style={{ color: '#f44336' }}>Erro ao carregar eventos. Tente novamente.</p>
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
