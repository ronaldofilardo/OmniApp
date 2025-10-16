import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

// Importando do pacote compartilhado
import { userLoginSchema, type UserLogin } from 'shared/src/validations';

import { useAuthStore } from '../store/auth.store';
import { useToast } from '../components/useToast';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

const LoginPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors['feedback-error']};
  font-size: 0.875rem;
  text-align: center;
`;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserLogin>({
    resolver: zodResolver(userLoginSchema), // Integração do Zod com o react-hook-form
  });

  const handleLogin = async (data: UserLogin) => {
    const success = await login(data);
    if (success) {
      toast.show('Login bem-sucedido!', 'success');
      navigate('/timeline');
    }
  };

  return (
    <LoginPageContainer>
      <LoginForm onSubmit={handleSubmit(handleLogin)}>
        <h1 style={{ textAlign: 'center' }}>Omni Saúde</h1>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>Tudo a Seu Tempo</p>
        <div>
          <Input
            type="email"
            placeholder="Digite seu e-mail"
            autoComplete="username"
            {...register('email')}
          />
          {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
        </div>
        <div>
          <Input
            type="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
        </div>

        {authError && <ErrorMessage>{authError}</ErrorMessage>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </LoginForm>
    </LoginPageContainer>
  );
}
