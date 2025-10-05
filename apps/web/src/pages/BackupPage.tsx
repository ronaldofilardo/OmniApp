import { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ArrowLeft, Warning, DownloadSimple, Archive } from 'phosphor-react'; // Ícone atualizado
import { api } from '../services/api';
import { Button } from '../components/Button';
import { useToast } from '../components/useToast';

// ... (Styled Components permanecem os mesmos)
const PageContainer = styled.div`
  max-width: 900px;
  margin: 1rem auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #555;
  text-decoration: none;
  &:hover {
    color: #000;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 2rem;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: ${({ isActive }) => (isActive ? '#000' : '#888')};
  border-bottom: 2px solid ${({ isActive, theme }) => (isActive ? theme.colors['feedback-success'] : 'transparent')};
  margin-bottom: -1px;
`;

const WarningBox = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
`;

const Card = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`;

const CardDescription = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

// NOVO: Container para os checkboxes de tipos de arquivo
const FileTypeSelection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const FILE_TYPES = [
  { type: 'Requisicao', label: 'Requisição' },
  { type: 'Autorizacao', label: 'Autorização' },
  { type: 'Atestado', label: 'Atestado' },
  { type: 'Prescricao', label: 'Prescrição' },
  { type: 'LaudoResultado', label: 'Laudo/Resultado' },
  { type: 'NotaFiscal', label: 'Nota Fiscal' },
];

export function BackupPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('backup');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isExportingFiles, setIsExportingFiles] = useState(false);

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const response = await api.get('/backup/data', {
        params: { includeDeleted },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `omni-saude-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.show('Não foi possível exportar os dados.', 'error');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleFileTypeChange = (type: string) => {
    setSelectedFileTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleExportFiles = async () => {
    if (selectedFileTypes.length === 0) {
      toast.show('Por favor, selecione pelo menos um tipo de arquivo para exportar.', 'error');
      return;
    }
    setIsExportingFiles(true);
    try {
      const response = await api.post('/backup/files', 
        { fileTypes: selectedFileTypes },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `omni-saude-arquivos-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Não foi possível exportar os arquivos.', 'error');
    } finally {
      setIsExportingFiles(false);
    }
  };

  return (
    <PageContainer>
      <Header>
        <BackLink to="/timeline"><ArrowLeft size={20} /> Voltar para a Timeline</BackLink>
      </Header>
      <Title>Backup e Restauração</Title>

      <TabContainer>
        <TabButton isActive={activeTab === 'backup'} onClick={() => setActiveTab('backup')}>Backup</TabButton>
        <TabButton isActive={activeTab === 'restauracao'} onClick={() => setActiveTab('restauracao')}>Restauração</TabButton>
      </TabContainer>

      <WarningBox>
        <Warning size={24} color="#096dd9" />
        <p>O backup de dados inclui todos os seus eventos e profissionais. Os arquivos físicos devem ser gerenciados separadamente.</p>
      </WarningBox>

      {activeTab === 'backup' && (
        <CardGrid>
          <Card>
            <CardTitle>Backup de Dados</CardTitle>
            <CardDescription>Exporte todos os eventos e profissionais para um arquivo JSON.</CardDescription>
            <CheckboxContainer>
              <input type="checkbox" id="includeDeleted" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} />
              <label htmlFor="includeDeleted">Incluir itens deletados</label>
            </CheckboxContainer>
            <Button onClick={handleExportData} disabled={isExportingData}>
              <DownloadSimple size={20} /> {isExportingData ? 'Exportando...' : 'Exportar Dados'}
            </Button>
          </Card>
          <Card>
            <CardTitle>Backup de Arquivos</CardTitle>
            <CardDescription>Faça cópias dos arquivos vinculados aos eventos selecionando os tipos abaixo.</CardDescription>
            <FileTypeSelection>
              {FILE_TYPES.map(({ type, label }) => (
                <CheckboxContainer key={type}>
                  <input type="checkbox" id={type} checked={selectedFileTypes.includes(type)} onChange={() => handleFileTypeChange(type)} />
                  <label htmlFor={type}>{label}</label>
                </CheckboxContainer>
              ))}
            </FileTypeSelection>
            <Button onClick={handleExportFiles} disabled={isExportingFiles}>
              <Archive size={20} /> {isExportingFiles ? 'Exportando...' : 'Backup de Arquivos'}
            </Button>
          </Card>
        </CardGrid>
      )}

      {activeTab === 'restauracao' && (
        <p>A funcionalidade de restauração estará disponível em breve.</p>
      )}
    </PageContainer>
  );
}
