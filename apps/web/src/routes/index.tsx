import { Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { TimelinePage } from '../pages/TimelinePage';
import { ManageEventPage } from '../pages/ManageEventPage';
import { ProfessionalsListPage } from '../pages/ProfessionalsListPage';
import { NewProfessionalPage } from '../pages/NewProfessionalPage';
import { FilesRepositoryPage } from '../pages/FilesRepositoryPage';
import { PrivateRoute } from './PrivateRoute'; 
import { AppLayout } from '../components/AppLayout';
// import { BackupPage } from '../pages/BackupPage'; // DESABILITADO PARA VERCEL DEPLOY
import { SharePage } from '../pages/SharePage';
import { CalendarPage } from '../pages/CalendarPage';
import { PublicUploadPage } from '../pages/PublicUploadPage';
import { ExternalSubmitPage } from '../pages/ExternalSubmitPage';
import { DiagnosticPage } from '../pages/DiagnosticPage';
import { ReceiveUrlDiagnosticPage } from '../pages/ReceiveUrlDiagnosticPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Rotas Públicas (sem layout principal) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/share/:shareToken" element={<SharePage />} />
      <Route path="/receber" element={<PublicUploadPage />} />
      <Route path="/external-submit" element={<ExternalSubmitPage />} />
      <Route path="/diagnostic" element={<DiagnosticPage />} />
      <Route path="/diagnostic-receive" element={<ReceiveUrlDiagnosticPage />} />
      
      {/* Rotas Privadas (com layout principal) */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<TimelinePage />} />
          <Route path="timeline" element={<TimelinePage />} />
        
        {/* Rotas para Eventos Pontuais */}
        <Route path="events/create" element={<ManageEventPage />} />
        <Route path="events/edit/:eventId" element={<ManageEventPage />} />
        
        {/* Outras rotas do sistema */}
        <Route path="professionals" element={<ProfessionalsListPage />} />
        <Route path="professionals/new" element={<NewProfessionalPage />} />
        <Route path="files" element={<FilesRepositoryPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        {/* <Route path="backup" element={<BackupPage />} /> */} {/* DESABILITADO PARA VERCEL DEPLOY */}
        
        {/* Rota de fallback para páginas não encontradas dentro do layout */}
        <Route path="*" element={<div style={{padding: '2rem', textAlign: 'center'}}>
          <h2>Página não encontrada</h2>
          <p>A página que você está procurando não existe.</p>
        </div>} />
      </Route>
      </Route>
      
      {/* Rota de fallback global */}
      <Route path="*" element={<div style={{padding: '2rem', textAlign: 'center'}}>
        <h2>Página não encontrada</h2>
        <p>A página que você está procurando não existe.</p>
        <a href="/" style={{color: '#007bff', textDecoration: 'none'}}>Voltar para o início</a>
      </div>} />
    </Routes>
  );
}
