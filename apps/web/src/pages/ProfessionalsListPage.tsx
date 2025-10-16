import { useState } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'phosphor-react';

import { api } from '../services/api';
import { useToast } from '../components/useToast';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ProfessionalCard } from '../components/ProfessionalCard';
import { ManageProfessionalForm } from '../components/ManageProfessionalForm'; // NOVO IMPORT

// ... (Styled Components sem alterações) ...
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
`;

const AddButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: auto;
  padding: 0.75rem 1.5rem;
`;

const ProfessionalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const Footer = styled.footer`
  text-align: center;
  margin-top: 4rem;
  color: #888;
  font-size: 0.875rem;
`;


// Funções da API
const fetchProfessionals = async () => {
  const { data } = await api.get('/professionals');
  return data;
};

const deleteProfessional = async (id: string) => {
  const { data } = await api.delete(`/professionals/${id}`);
  return data;
};

export function ProfessionalsListPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false); // NOVO ESTADO
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: fetchProfessionals,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfessional,
    onSuccess: (data: any) => {
      // API returns { action: 'soft_delete'|'hard_delete', ... }
      if (data?.action === 'soft_delete') {
        toast.show('Profissional marcado como excluído: existem eventos vinculados e eles não foram removidos.', 'info');
      } else {
        toast.show('Profissional deletado com sucesso.', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setDeleteModalOpen(false);
      setSelectedProfessionalId(null);
    },
    onError: (err: any) => {
      toast.show(err.response?.data?.message || 'Ocorreu um erro.', 'error');
      setDeleteModalOpen(false);
      setSelectedProfessionalId(null);
    },
  });

  const handleDeleteClick = (id: string) => {
    setSelectedProfessionalId(id);
    setDeleteModalOpen(true);
  };

  // NOVA FUNÇÃO: Abre o modal de edição
  const handleEditClick = (id: string) => {
    setSelectedProfessionalId(id);
    setEditModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProfessionalId) {
      deleteMutation.mutate(selectedProfessionalId);
    }
  };

  if (isLoading) return <p>Carregando profissionais...</p>;

  return (
    <>
      <PageContainer>
        <Header>
          <Title>Profissionais</Title>
          <Link to="/professionals/new">
            <AddButton>
              <Plus size={20} /> Adicionar Profissional
            </AddButton>
          </Link>
        </Header>

        <ProfessionalsGrid>
          {professionals?.map((prof: any) => (
            <ProfessionalCard 
              key={prof.id} 
              professional={prof} 
              onDelete={handleDeleteClick}
              onEdit={handleEditClick} // Passa a nova função
            />
          ))}
        </ProfessionalsGrid>
        
        <Footer>© 2025 Omni Saúde</Footer>
      </PageContainer>

      {/* Modal de Edição */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
        <h2>Editar Profissional</h2>
        <ManageProfessionalForm 
          professionalId={selectedProfessionalId}
          onSuccess={() => setEditModalOpen(false)}
        />
      </Modal>

      {/* Modal de Exclusão */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <h2>Confirmar Exclusão</h2>
        <p>
          Tem certeza que deseja excluir este profissional?
          Se houver eventos associados (passados ou futuros), os eventos não serão removidos e o profissional será apenas marcado como excluído na lista. Caso não exista nenhum evento associado, o profissional será removido definitivamente.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <Button onClick={() => setDeleteModalOpen(false)} style={{ backgroundColor: '#6c757d' }}>
            Cancelar
          </Button>
          <Button onClick={confirmDelete} disabled={deleteMutation.isPending} style={{ backgroundColor: '#D32F2F' }}>
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
