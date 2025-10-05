import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ManageProfessionalForm } from '../components/ManageProfessionalForm';

const PageContainer = styled.div`
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
`;

export function NewProfessionalPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <Title>Adicionar Novo Profissional</Title>
      <ManageProfessionalForm onSuccess={() => navigate('/professionals')} />
    </PageContainer>
  );
}
