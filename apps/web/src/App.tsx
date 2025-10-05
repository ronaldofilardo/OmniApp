import { ThemeProvider } from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { GlobalStyle } from './styles/global';
import { defaultTheme } from './styles/theme';
import { AppRouter } from './routes';
import { useEventStore } from './store/event.store';
import { ToastProvider } from './components/Toast';

// Cria uma instância do cliente do React Query
const queryClient = new QueryClient();

 useEventStore.setState({ queryClient });
 

export function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <GlobalStyle />
            <AppRouter />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
