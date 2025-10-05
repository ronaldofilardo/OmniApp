import { useState, useEffect } from 'react';

export function ReceiveUrlDiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState({
    windowOrigin: '',
    hostname: '',
    protocol: '',
    port: '',
    href: '',
    viteEnvs: {
      VITE_FRONTEND_URL: '',
      VITE_APP_BASE_URL: '',
      VITE_API_BASE_URL: ''
    },
    frontendBase: '',
    sampleUploadUrl: ''
  });

  useEffect(() => {
    const windowOrigin = window.location.origin;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    const href = window.location.href;
    
    const viteEnvs = {
      VITE_FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'NOT_SET',
      VITE_APP_BASE_URL: import.meta.env.VITE_APP_BASE_URL || 'NOT_SET', 
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'NOT_SET'
    };

    // Simular a mesma lógica do ReceiveFileModal
    const getFrontendBase = () => {
      if (import.meta.env.VITE_FRONTEND_URL) {
        return import.meta.env.VITE_FRONTEND_URL;
      }
      
      if (typeof window !== 'undefined') {
        return window.location.origin;
      }
      
      return 'http://localhost:5173';
    };

    const frontendBase = getFrontendBase();
    const sampleEventId = '12345678-1234-1234-1234-123456789abc';
    const sampleUploadUrl = `${frontendBase.replace(/\/$/, '')}/receber/exame/${sampleEventId}`;

    setDiagnostics({
      windowOrigin,
      hostname,
      protocol,
      port,
      href,
      viteEnvs,
      frontendBase,
      sampleUploadUrl
    });

    // Logs detalhados no console
    console.log('🔍 RECEIVE URL DIAGNOSTICS:', {
      windowOrigin,
      hostname,
      protocol,
      port,
      href,
      viteEnvs,
      frontendBase,
      sampleUploadUrl
    });
  }, []);

  const testReceiveUrl = () => {
    const testUrl = diagnostics.sampleUploadUrl;
    console.log('🧪 Testing receive URL:', testUrl);
    
    // Tentar navegar para a URL
    try {
      window.open(testUrl, '_blank');
    } catch (error) {
      console.error('❌ Erro ao abrir URL:', error);
      alert('Erro ao abrir URL: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>🔍 Diagnóstico URL Receber Docs</h1>
      
      <div style={{ background: '#f0f0f0', padding: '15px', margin: '10px 0' }}>
        <h3>📍 Informações do Window.location:</h3>
        <p><strong>Origin:</strong> {diagnostics.windowOrigin}</p>
        <p><strong>Hostname:</strong> {diagnostics.hostname}</p>
        <p><strong>Protocol:</strong> {diagnostics.protocol}</p>
        <p><strong>Port:</strong> {diagnostics.port || 'default'}</p>
        <p><strong>Full URL:</strong> {diagnostics.href}</p>
      </div>

      <div style={{ background: '#e8f4fd', padding: '15px', margin: '10px 0' }}>
        <h3>⚙️ Variáveis de Ambiente VITE:</h3>
        <p><strong>VITE_FRONTEND_URL:</strong> {diagnostics.viteEnvs.VITE_FRONTEND_URL}</p>
        <p><strong>VITE_APP_BASE_URL:</strong> {diagnostics.viteEnvs.VITE_APP_BASE_URL}</p>
        <p><strong>VITE_API_BASE_URL:</strong> {diagnostics.viteEnvs.VITE_API_BASE_URL}</p>
      </div>

      <div style={{ background: '#fff3cd', padding: '15px', margin: '10px 0' }}>
        <h3>🛠️ Lógica de Detecção:</h3>
        <p><strong>Frontend Base Detectado:</strong> {diagnostics.frontendBase}</p>
        <p><strong>URL de Recebimento Exemplo:</strong><br />
           <code style={{ background: '#f8f9fa', padding: '4px', wordBreak: 'break-all' }}>
             {diagnostics.sampleUploadUrl}
           </code>
        </p>
      </div>

      <div style={{ background: diagnostics.frontendBase.includes('undefined') ? '#f8d7da' : '#d4edda', padding: '15px', margin: '10px 0' }}>
        <h3>✅ Status:</h3>
        {diagnostics.frontendBase.includes('undefined') ? (
          <p style={{ color: 'red' }}><strong>❌ PROBLEMA:</strong> Frontend base contém 'undefined'</p>
        ) : (
          <p style={{ color: 'green' }}><strong>✅ OK:</strong> Frontend base detectado corretamente</p>
        )}
      </div>

      <button 
        onClick={testReceiveUrl}
        style={{ 
          background: '#28a745', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        🧪 Testar URL de Recebimento
      </button>

      <button 
        onClick={() => window.location.reload()}
        style={{ 
          background: '#17a2b8', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        🔄 Recarregar Diagnóstico
      </button>

      <div style={{ background: '#f8f9fa', padding: '15px', margin: '20px 0 10px 0', border: '1px solid #dee2e6' }}>
        <h4>📝 Instruções:</h4>
        <ol style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Verifique se o "Frontend Base Detectado" está correto</li>
          <li>Clique no botão "Testar URL de Recebimento"</li>
          <li>Abra o console do navegador (F12) para ver logs detalhados</li>
          <li>Se a URL estiver com 'undefined', há problema na detecção</li>
          <li>Relate os resultados para análise</li>
        </ol>
      </div>
    </div>
  );
}