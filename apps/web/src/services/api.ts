import axios from 'axios';

// A URL base é determinada dinamicamente para suportar acesso de rede local
function getApiBaseUrl() {
  // Se há uma variável de ambiente definida, usar ela
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🔧 API URL from env:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Se estamos acessando via IP da rede local, usar o mesmo IP para a API
  const currentHost = window.location.hostname;
  const protocol = window.location.protocol;
  const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

  console.log('🔍 API Detection - hostname:', currentHost, 'protocol:', protocol, 'isLocalhost:', isLocalhost);

  if (!isLocalhost) {
    // Para rede local, usar a porta da API (3333)
    const apiUrl = `${protocol}//${currentHost}:3333`;
    console.log('🔗 Network API URL constructed:', apiUrl);
    return apiUrl;
  }

  // Fallback para localhost API
  console.log('🏠 Using localhost API fallback');
  return 'http://localhost:3333';
}

const baseURL = getApiBaseUrl();

export const api = axios.create({
  baseURL: baseURL,
});

// Autenticação JWT removida - acesso livre a todos os endpoints
