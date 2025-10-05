import { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Select, { type SingleValue } from 'react-select';
import { createProfessionalSchema, type CreateProfessional } from 'shared/src/validations';
import { api } from '../services/api';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';
import { useToast } from './useToast';

// Styled Components
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 400px; /* Garante largura mínima para o formulário no modal */
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors['feedback-error']};
  font-size: 0.875rem;
`;

// Tipagem
interface SelectOption {
  value: string;
  label: string;
  isFixed?: boolean;
}

// Funções da API
const fetchProfessionalById = async (id: string) => {
  const { data } = await api.get(`/professionals/${id}`);
  return data;
};

const fetchSpecialties = async (): Promise<string[]> => {
  const { data } = await api.get('/professionals/specialties');
  return data;
};

const createProfessional = async (data: CreateProfessional) => {
  const { data: response } = await api.post('/professionals', data);
  return response;
};

const updateProfessional = async ({ id, data }: { id: string, data: CreateProfessional }) => {
  const { data: response } = await api.put(`/professionals/${id}`, data);
  return response;
};

// Props do Componente
interface ManageProfessionalFormProps {
  professionalId?: string | null;
  onSuccess: () => void;
}

export function ManageProfessionalForm({ professionalId, onSuccess }: ManageProfessionalFormProps) {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(professionalId);
  const toast = useToast();

  const [isSpecialtyModalOpen, setSpecialtyModalOpen] = useState(false);
  const [newSpecialtyName, setNewSpecialtyName] = useState('');

  const { data: existingData, isLoading: isLoadingProfessional } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: () => fetchProfessionalById(professionalId!),
    enabled: isEditMode,
  });

  const { data: fetchedSpecialties = [] } = useQuery({
    queryKey: ['specialties'],
    queryFn: fetchSpecialties,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch, // Adicionado para observar o valor da especialidade
    formState: { errors },
  } = useForm<CreateProfessional>({
    resolver: zodResolver(createProfessionalSchema),
  });

  const currentSpecialtyValue = watch('specialty');

  useEffect(() => {
    if (isEditMode && existingData) {
      reset(existingData);
    } else if (!isEditMode) {
      reset({ name: '', specialty: '', address: '', contact: '' });
    }
  }, [isEditMode, existingData, reset]);

  const mutation = useMutation({
    mutationFn: (data: CreateProfessional) => 
      isEditMode 
        ? updateProfessional({ id: professionalId!, data }) 
        : createProfessional(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.show(err.response?.data?.message || 'Ocorreu um erro.', 'error');
    }
  });

  const onSubmit = (data: CreateProfessional) => {
    mutation.mutate(data);
  };

  const handleSpecialtyChange = (option: SingleValue<SelectOption>) => {
    if (option?.value === 'add_new_specialty') {
      setSpecialtyModalOpen(true);
    } else {
      setValue('specialty', option ? option.value : '', { shouldValidate: true });
    }
  };

  const handleAddNewSpecialty = () => {
    const trimmedName = newSpecialtyName.trim();
    if (trimmedName === '') return;
    
    // Define o valor no formulário
    setValue('specialty', trimmedName, { shouldValidate: true });
    
    // Limpa e fecha o modal
    setNewSpecialtyName('');
    setSpecialtyModalOpen(false);
  };

  // CORREÇÃO: Lógica para construir as opções dinamicamente
  const specialtyOptions = useMemo(() => {
    const options: SelectOption[] = fetchedSpecialties.map(s => ({ value: s, label: s }));
    
    // Se a especialidade atual (do formulário) não estiver na lista, adicione-a
    if (currentSpecialtyValue && !fetchedSpecialties.includes(currentSpecialtyValue)) {
      options.unshift({ value: currentSpecialtyValue, label: currentSpecialtyValue });
    }
    
    // Adiciona a opção fixa no final
    options.push({ value: 'add_new_specialty', label: 'Adicionar nova especialidade...', isFixed: true });
    
    return options;
  }, [fetchedSpecialties, currentSpecialtyValue]);


  if (isLoadingProfessional) return <p>Carregando dados do profissional...</p>;

  return (
    <>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <label htmlFor="name">Nome</label>
          <Input id="name" {...register('name')} />
          {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
        </FieldGroup>

        <FieldGroup>
          <label htmlFor="specialty">Especialidade</label>
          <Controller
            name="specialty"
            control={control}
            render={({ field }) => (
              <Select
                options={specialtyOptions}
                placeholder="Selecione uma especialidade..."
                // CORREÇÃO: Encontra a opção correta na lista dinâmica
                value={specialtyOptions.find(c => c.value === field.value)}
                onChange={handleSpecialtyChange}
                styles={{ option: (base, { data }) => (data.isFixed ? { ...base, fontStyle: 'italic', color: '#007BFF' } : base) }}
              />
            )}
          />
          {errors.specialty && <ErrorMessage>{errors.specialty.message}</ErrorMessage>}
        </FieldGroup>

        <FieldGroup>
          <label htmlFor="address">Endereço (opcional)</label>
          <Input id="address" {...register('address')} />
        </FieldGroup>

        <FieldGroup>
          <label htmlFor="contact">Contato (opcional)</label>
          <Input id="contact" {...register('contact')} />
        </FieldGroup>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </Form>

      <Modal isOpen={isSpecialtyModalOpen} onClose={() => setSpecialtyModalOpen(false)}>
        <h2>Adicionar Nova Especialidade</h2>
        <FieldGroup>
          <label htmlFor="new-specialty">Nome da Especialidade</label>
          <Input 
            id="new-specialty"
            value={newSpecialtyName}
            onChange={(e) => setNewSpecialtyName(e.target.value)}
            placeholder="Ex: Fisioterapia"
          />
        </FieldGroup>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <Button onClick={() => setSpecialtyModalOpen(false)} style={{backgroundColor: '#808080'}}>Cancelar</Button>
          <Button onClick={handleAddNewSpecialty}>Adicionar e Selecionar</Button>
        </div>
      </Modal>
    </>
  );
}
