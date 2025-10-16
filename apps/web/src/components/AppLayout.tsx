import { useState } from 'react';
import styled from 'styled-components';
import { NavLink, Outlet } from 'react-router-dom';
// CORREÇÃO: Import limpo, sem duplicatas
import { ChartLine, Users, Files, Calendar, List, X } from 'phosphor-react';
import { NotificationBell } from './NotificationBell';

// --- Styled Components com Media Queries (sem alterações) ---

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f4f7f6;
`;

const Sidebar = styled.aside<{ $isOpen: boolean }>`
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out;
  z-index: 1001;

  @media (max-width: 768px) {
    position: fixed;
    height: 100%;
  transform: ${({ $isOpen }) => ($isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  color: #333;
  text-align: center;
  margin-bottom: 3rem;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: #555;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;

  &.active {
    background-color: ${({ theme }) => theme.colors['feedback-success']};
    color: white;
  }

  &:hover:not(.active) {
    background-color: #f0f0f0;
  }
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  position: relative;

  @media (max-width: 768px) {
    padding-top: 5rem;
  }
`;

const MenuButton = styled.button`
  display: none;
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 1002;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1000;

  @media (max-width: 768px) {
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  }
`;

export function AppLayout() {
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!isMenuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <AppContainer>
      <MenuButton onClick={toggleMenu}>
        {isMenuOpen ? <X size={24} /> : <List size={24} />}
      </MenuButton>
  <Overlay $isOpen={isMenuOpen} onClick={closeMenu} />
  <Sidebar $isOpen={isMenuOpen}>
        <Logo>Omni Saúde</Logo>
        {/* CORREÇÃO: Lista de navegação limpa e ordenada */}
        <Nav>
          <StyledNavLink to="/timeline" onClick={closeMenu}>
            <ChartLine size={20} />
            Timeline
          </StyledNavLink>
          {/* Eventos Repetitivos removidos - funcionalidade eliminada */}
          <StyledNavLink to="/professionals" onClick={closeMenu}>
            <Users size={20} />
            Profissionais
          </StyledNavLink>
          <StyledNavLink to="/files" onClick={closeMenu}>
            <Files size={20} />
            Repositório
          </StyledNavLink>
          <StyledNavLink to="/calendar" onClick={closeMenu}>
            <Calendar size={20} />
            Calendário
          </StyledNavLink>
          {/* <StyledNavLink to="/backup" onClick={closeMenu}>
            <FloppyDisk size={20} />
            Backup
          </StyledNavLink> */} {/* DESABILITADO PARA VERCEL DEPLOY */}
        </Nav>
      </Sidebar>
      <MainContent>
        <NotificationBell />
        <Outlet />
      </MainContent>
    </AppContainer>
  );
}
