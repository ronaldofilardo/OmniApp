import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bell, X } from 'phosphor-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { usePushNotifications } from '../hooks/usePushNotifications';

const BellContainer = styled.div`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  @media (max-width: 480px) {
    top: 0.5rem;
    right: 0.5rem;
  }
`;

const BellButton = styled.button<{ $hasUnread: boolean }>`
  position: relative;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f0f0;
  }

  ${({ $hasUnread }) => $hasUnread && `
    &::after {
      content: '';
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background-color: #dc3545;
      border-radius: 50%;
      border: 2px solid #fff;
    }
  `}
`;

const Dropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 50px;
  right: 0;
  width: 350px;
  max-height: 400px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  z-index: 1001;
`;

const DropdownHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotificationList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const NotificationItem = styled.div<{ $isUnread: boolean }>`
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  ${({ $isUnread }) => $isUnread && `
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
  `}
`;

const NotificationMessage = styled.div`
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const NotificationTime = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
`;

const MarkAllReadButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.5rem 1rem;

  &:hover {
    text-decoration: underline;
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6c757d;
`;

interface Notification {
  id: string;
  message: string;
  type: string;
  status: 'unread' | 'read';
  action_url?: string;
  created_at: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { subscribeToPush } = usePushNotifications();

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then(res => res.data.count),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(res => res.data),
    enabled: isOpen,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/mark-as-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Mark all as read
  const markAllAsRead = async () => {
    if (!notifications) return;
    const unreadNotifications = notifications.filter((n: Notification) => n.status === 'unread');
    await Promise.all(
      unreadNotifications.map((n: Notification) => markAsReadMutation.mutateAsync(n.id))
    );
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    if (notification.action_url) {
      // Preferir navegação cliente-side para manter estado e evitar reloads que possam causar perda de sessão
      try {
        const url = new URL(notification.action_url, window.location.origin);
        // usar react-router navigate com pathname + search
        navigate(url.pathname + url.search + url.hash);
        // Se a URL contém eventId na query string, disparar evento global para abrir o modal de arquivos
        try {
          const params = new URLSearchParams(url.search);
          const eventId = params.get('eventId');
          if (eventId) {
            // dispatch com pequena espera para garantir que a timeline/container monte os EventCards
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('openFilesModal', { detail: { eventId } }));
            }, 200);
          }
        } catch {
          // ignore
        }
      } catch {
        // fallback simples se parsing falhar
        window.location.href = notification.action_url;
      }
    }
    setIsOpen(false);
  };

  // Request push permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await subscribeToPush();
        }
      }
    };
    requestPermission();
  }, [subscribeToPush]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    return `há ${diffDays}d`;
  };

  return (
    <BellContainer>
      <BellButton
        $hasUnread={!!unreadCount && unreadCount > 0}
        onClick={() => setIsOpen(!isOpen)}
        title="Notificações"
      >
        <Bell size={20} />
      </BellButton>

      <Dropdown $isOpen={isOpen}>
        <DropdownHeader>
          Notificações
          <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
        </DropdownHeader>

        <NotificationList>
          {notifications && notifications.length > 0 ? (
            <>
              {notifications.map((notification: Notification) => (
                <NotificationItem
                  key={notification.id}
                  $isUnread={notification.status === 'unread'}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <NotificationMessage>{notification.message}</NotificationMessage>
                  <NotificationTime>{formatTime(notification.created_at)}</NotificationTime>
                </NotificationItem>
              ))}
              {unreadCount > 0 && (
                <MarkAllReadButton onClick={markAllAsRead}>
                  Marcar todas como lidas
                </MarkAllReadButton>
              )}
            </>
          ) : (
            <EmptyState>Nenhuma notificação</EmptyState>
          )}
        </NotificationList>
      </Dropdown>
    </BellContainer>
  );
}