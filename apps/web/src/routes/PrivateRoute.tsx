import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export function PrivateRoute() {
  const { isAuthenticated } = useAuthStore();

  // Se o usuário está autenticado, renderiza o conteúdo da rota (Outlet).
  // Se não, redireciona para a página de login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
