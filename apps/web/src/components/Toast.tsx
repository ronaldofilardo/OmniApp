import { useState } from 'react';
import { ToastContext } from './ToastContext';
import type { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { X } from 'phosphor-react';

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' };

const Container = styled.div`
  position: fixed;
  right: 1rem;
  top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 9999;
`;

const toastStyle = {
  info: css`
    background: #edf2ff;
    color: #1e40af;
    border: 1px solid rgba(30,64,175,0.12);
  `,
  success: css`
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid rgba(6,95,70,0.12);
  `,
  error: css`
    background: #fff1f2;
    color: #9f1239;
    border: 1px solid rgba(159,18,57,0.12);
  `,
};

const ToastBox = styled.div<{ t: Toast['type'] }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  min-width: 240px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  ${({ t }) => toastStyle[t || 'info']}
`;

const Close = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function show(message: string, type: Toast['type'] = 'info') {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
    const t: Toast = { id, message, type };
    setToasts(prev => [t, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, 5000);
  }

  function remove(id: string) {
    setToasts(prev => prev.filter(x => x.id !== id));
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Container>
        {toasts.map(t => (
          <ToastBox key={t.id} t={t.type}>
            <div>{t.message}</div>
            <Close onClick={() => remove(t.id)} aria-label="fechar">
              <X size={16} />
            </Close>
          </ToastBox>
        ))}
      </Container>
    </ToastContext.Provider>
  );
}
