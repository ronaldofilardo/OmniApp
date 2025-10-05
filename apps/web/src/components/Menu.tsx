import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

const MenuContainer = styled.nav`
  width: 250px;
  height: 100vh;
  background-color: #f4f4f4;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
`;

const MenuHeader = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors['primary-blue']};
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MenuItem = styled.li``;

const StyledNavLink = styled(NavLink)`
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  border-radius: 6px;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: #e9e9e9;
  }

  &.active {
    background-color: ${({ theme }) => theme.colors['primary-blue']};
    color: white;
    font-weight: bold;
  }
`;

export function Menu() {
  return (
    <MenuContainer>
      <MenuHeader>Omni Saúde</MenuHeader>
      <MenuList>
        <MenuItem>
          <StyledNavLink to="/timeline">Timeline</StyledNavLink>
        </MenuItem>
        <MenuItem>
          <StyledNavLink to="/professionals">Profissionais</StyledNavLink>
        </MenuItem>
        {/* Outros itens de menu podem ser adicionados aqui no futuro */}
      </MenuList>
    </MenuContainer>
  );
}
