import styled from 'styled-components';

export const Button = styled.button`
  width: 100%;
  padding: 1rem;
  border: 0;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors['feedback-success']};
  color: #FFFFFF;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background-color: #3a9d4a; // Um tom de verde um pouco mais escuro para o hover
  }
`;
