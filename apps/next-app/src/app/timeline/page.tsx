'use client';

import styled from 'styled-components';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '../../components/Button';

import type { TimelineItem } from '../../types/timeline';

// Styled Components (sem alterações)
const TimelineContainer = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const TimelineLayout = styled.div`
  position: relative;
  padding: 2rem 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 100%;
    background-color: #e0e0e0;
  }

  @media (max-width: 768px) {
    &::before {
      left: 1.5rem;
    }
  }
`;

const DayGroup = styled.div`
  position: relative;
  margin-bottom: 3rem;
`;

const DayHeader = styled.div`
  position: sticky;
  top: 0;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  z-index: 10;
  text-align: center;
  font-weight: bold;
  color: #555;
  margin-bottom: 2rem;

  span {
    background-color: #f8f9fa;
    padding: 0 1rem;
  }
`;

const EventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

// Função da API para buscar os itens da timeline
const fetchTimelineItems = async () => {
  // Buscar desde o início do ano até o final do próximo ano para capturar todos os eventos
  const currentYear = new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear + 1}-12-31`;
  const response = await fetch(`/api/timeline?startDate=${startDate}&endDate=${endDate}`);
  if (!response.ok) {
    throw new Error('Failed to fetch timeline');
  }
  return response.json();
};

// Função para agrupar os itens por dia
const groupItemsByDay = (items: TimelineItem[]): Record<string, TimelineItem[]> => {
  return items.reduce((acc: Record<string, TimelineItem[]>, item: TimelineItem) => {
    const dateStr = item.date || item.occurrence_timestamp || item.due_date;
    if (!dateStr) return acc; // ignorar itens sem data

    let parsedDay: string;
    try {
      parsedDay = format(parseISO(String(dateStr)), 'yyyy-MM-dd');
    } catch {
      return acc;
    }

    if (!acc[parsedDay]) {
      acc[parsedDay] = [];
    }
    acc[parsedDay].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);
};

export default function TimelinePage() {
  const { data: timelineItems, isLoading, error } = useQuery<TimelineItem[]>({
    queryKey: ['timeline'],
    queryFn: fetchTimelineItems,
  });

  // Buscar notificações e construir um mapa de eventId -> info
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then(res => res.json()),
  });

  const notificationsMap: Record<string, { total: number; unread: number }> = {};
  if (Array.isArray(notifications)) {
    for (const n of notifications) {
      try {
        const url = new URL(n.action_url || '/', window.location.origin);
        const eventId = url.searchParams.get('eventId');
        if (!eventId) continue;
        if (!notificationsMap[eventId]) notificationsMap[eventId] = { total: 0, unread: 0 };
        notificationsMap[eventId].total += 1;
        if (n.status === 'unread') notificationsMap[eventId].unread += 1;
      } catch {
        // ignore malformed
      }
    }
  }

  // Estado local para controlar qual ocorrência está ativa/selecionada
  const [activeOccurrenceId, setActiveOccurrenceId] = useState<string | null>(null);

  if (isLoading) return <p>Carregando sua timeline...</p>;
  if (error) return <p>Ocorreu um erro ao buscar seus eventos.</p>;

  const groupedItems = groupItemsByDay(timelineItems || []);
  const sortedDays = Object.keys(groupedItems).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <TimelineContainer>
      <Header>
        <h1>Minha Timeline</h1>
        <Link href="/events/create">
          <Button>Novo Evento Pontual</Button>
        </Link>
      </Header>

      {timelineItems && timelineItems.length > 0 ? (
        <TimelineLayout>
          {sortedDays.map(day => (
            <DayGroup key={day}>
              <DayHeader>
                <span>{format(parseISO(day), "dd/MM/yyyy - EEEE", { locale: ptBR })}</span>
              </DayHeader>
              <EventsList>
                {groupedItems[day].map((item: TimelineItem, index: number) => {
                  // Renderizar ocorrências e eventos pontuais
                  if (item.item_type === 'occurrence') {
                    return (
                      <div key={item.occurrence_id}>
                        {/* EventCard component would go here */}
                        <p>Occurrence: {item.occurrence_id}</p>
                      </div>
                    );
                  }

                  if (item.item_type === 'event') {
                    return (
                      <div key={item.id}>
                        {/* EventCard component would go here */}
                        <p>Event: {item.id}</p>
                      </div>
                    );
                  }

                  // TODO: Renderizar ReminderCard para itens do tipo 'reminder'
                  return null;
                })}
              </EventsList>
            </DayGroup>
          ))}
        </TimelineLayout>
      ) : (
        <p>Você ainda não tem eventos na sua timeline.</p>
      )}
    </TimelineContainer>
  );
}