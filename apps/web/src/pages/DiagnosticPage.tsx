import { useState, useEffect } from 'react';

export function DiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState({
    hostname: '',
    protocol: '',
    port: '',
    apiUrl: '',
    envApiUrl: '',
    isLocalhost: false
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    const envApiUrl = import.meta.env.VITE_API_BASE_URL || 'NOT_SET';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    console.log('🔍 DEBUG - hostname:', hostname, 'isLocalhost:', isLocalhost);
    
    let apiUrl = '';
    if (envApiUrl !== 'NOT_SET') {
      apiUrl = envApiUrl;
      console.log('🔧 Using ENV API URL:', apiUrl);
    } else if (!isLocalhost) {
      apiUrl = `${protocol}//${hostname}:3333`;
      console.log('🌍 Using network API URL:', apiUrl);
    } else {
      apiUrl = 'http://localhost:3333';
      console.log('🏠 Using localhost API URL:', apiUrl);
    }

    setDiagnostics({
      hostname,
      protocol,
      port,
      apiUrl,
      envApiUrl,
      isLocalhost
    });

    // Logs para console
    console.log('🔍 DIAGNOSTICS:', {
      hostname,
      protocol, 
      port,
      apiUrl,
      envApiUrl,
      isLocalhost
    });
  }, []);

  const testApiCall = async () => {
    try {
      console.log('🧪 Testing API call to:', diagnostics.apiUrl + '/health');
      const response = await fetch(diagnostics.apiUrl + '/health');
      const data = await response.json();
      console.log('✅ API Test Success:', data);
      alert('✅ API Test Success: ' + JSON.stringify(data));
    } catch (error) {
      console.error('❌ API Test Failed:', error);
      alert('❌ API Test Failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Diagnóstico de Rede</h1>
      
      <div style={{ background: '#f0f0f0', padding: '15px', margin: '10px 0' }}>
        <h3>Informações da URL:</h3>
        <p><strong>Hostname:</strong> {diagnostics.hostname}</p>
        <p><strong>Protocol:</strong> {diagnostics.protocol}</p>
        <p><strong>Port:</strong> {diagnostics.port}</p>
        <p><strong>É Localhost:</strong> {diagnostics.isLocalhost ? 'SIM' : 'NÃO'}</p>
      </div>

      <div style={{ background: '#e8f4fd', padding: '15px', margin: '10px 0' }}>
        <h3>Configuração da API:</h3>
        <p><strong>ENV API URL:</strong> {diagnostics.envApiUrl}</p>
        <p><strong>URL da API Detectada:</strong> {diagnostics.apiUrl}</p>
      </div>

      <button 
        onClick={testApiCall}
        style={{ 
          background: '#007acc', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        🧪 Testar Chamada da API
      </button>

      <div style={{ background: '#fff3cd', padding: '15px', margin: '10px 0' }}>
        <h4>Instruções:</h4>
        <ol>
          <li>Verifique as informações acima</li>
          <li>Clique no botão "Testar Chamada da API"</li>
          <li>Abra o console do navegador (F12) para ver logs detalhados</li>
          <li>Relate os resultados</li>
        </ol>
      </div>
    </div>
  );
}