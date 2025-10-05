// ... (imports e styled-components)
import styled from 'styled-components';
import { PencilSimple, Trash } from 'phosphor-react';

// ...

interface ProfessionalCardProps {
  professional: any; // Simplificado para o exemplo
  onDelete: (id: string) => void;
  onEdit: (id: string) => void; // NOVA PROP
}

export function ProfessionalCard({ professional, onDelete, onEdit }: ProfessionalCardProps) {
  return (
    <CardContainer>
      <InfoSection>
        <Name>{professional.name}</Name>
        <Specialty>{professional.specialty}</Specialty>
        {professional.address && <Address>{professional.address}</Address>}
      </InfoSection>
      <ActionsSection>
        {/* MODIFICAÇÃO: O Link foi removido e substituído por um botão que chama onEdit */}
        <ActionButton onClick={() => onEdit(professional.id)}>
          <PencilSimple size={16} /> Editar
        </ActionButton>
        <DeleteButton onClick={() => onDelete(professional.id)}>
          <Trash size={16} /> Excluir
        </DeleteButton>
      </ActionsSection>
    </CardContainer>
  );
}

// (O resto dos styled-components permanece o mesmo)
const CardContainer = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  }
`;

const InfoSection = styled.div`
  margin-bottom: 1rem;
`;

const Name = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
`;

const Specialty = styled.p`
  font-size: 1rem;
  color: #555;
  margin: 0;
`;

const Address = styled.p`
  font-size: 0.9rem;
  color: #777;
  margin-top: 0.5rem;
`;

const ActionsSection = styled.div`
  display: flex;
  gap: 1rem;
  border-top: 1px solid #f0f0f0;
  padding-top: 1rem;
  margin-top: auto;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #444;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const DeleteButton = styled(ActionButton)`
  &:hover {
    background-color: #ffebee;
    color: ${({ theme }) => theme.colors['primary-red']};
    border-color: #ffcdd2;
  }
`;
