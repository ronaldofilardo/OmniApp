import styled from 'styled-components';
import { Outlet } from 'react-router-dom';
import { Menu } from '../components/Menu';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const ContentContainer = styled.main`
  flex: 1;
  overflow-y: auto; // Permite rolagem do conteúdo principal
  padding: 2rem;
  background-color: #FAFAFA;
`;

export function MainLayout() {
  return (
    <LayoutContainer>
      <Menu />
      <ContentContainer>
        <Outlet /> {/* Onde as páginas da rota serão renderizadas */}
      </ContentContainer>
    </LayoutContainer>
  );
}
