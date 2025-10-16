import { useState } from 'react';
import styled from 'styled-components';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CreatableSelect from 'react-select/creatable';
import { createProfessionalSchema, type CreateProfessional } from 'shared/validations';
import { api } from '../services/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors['feedback-error']};
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

interface ProfessionalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProfessional: { value: string; label: string }) => void;
}

const fetchSpecialties = async (): Promise<string[]> => {
  const { data } = await api.get('/professionals/specialties');
  return data;
};

export function ProfessionalFormModal({ isOpen, onClose, onSuccess }: ProfessionalFormModalProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: specialtiesOptions = [] } = useQuery({
    queryKey: ['specialties'],
    queryFn: fetchSpecialties,
    select: (data: string[]) => data.map(s => ({ value: s, label: s })),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateProfessional>({
    resolver: zodResolver(createProfessionalSchema),
  });

  const handleFormSubmit = async (data: CreateProfessional) => {
    setSubmissionError(null);
    try {
      const checkResponse = await api.post('/professionals/check', { name: data.name, specialty: data.specialty });
      if (checkResponse.data.exists) {
        setSubmissionError('Este profissional já está cadastrado.');
        return;
      }

      const createResponse = await api.post('/professionals', data);
      
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      
      onSuccess({
        value: createResponse.data.name,
        label: `${createResponse.data.name} - ${createResponse.data.specialty}`,
      });
      
      reset();
      onClose();
    } catch (error) {
      setSubmissionError('Ocorreu um erro ao salvar o profissional. Tente novamente.');
    }
  };

  const handleClose = () => {
    reset();
    setSubmissionError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <h2>Adicionar Novo Profissional</h2>
      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <FieldGroup>
          <label>Nome</label>
          <Input {...register('name')} />
          {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
        </FieldGroup>
        <FieldGroup>
          <label>Especialidade</label>
          <Controller
            name="specialty"
            control={control}
            render={({ field }) => (
              <CreatableSelect
                isClearable
                options={specialtiesOptions}
                placeholder="Selecione ou crie..."
                formatCreateLabel={inputValue => `Criar "${inputValue}"`}
                value={specialtiesOptions.find(c => c.value === field.value)}
                onChange={val => field.onChange(val?.value)}
              />
            )}
          />
          {errors.specialty && <ErrorMessage>{errors.specialty.message}</ErrorMessage>}
        </FieldGroup>
        <FieldGroup>
          <label>Endereço (opcional)</label>
          <Input {...register('address')} />
        </FieldGroup>
        <FieldGroup>
          <label>Contato (opcional)</label>
          <Input {...register('contact')} />
        </FieldGroup>

        {submissionError && <ErrorMessage>{submissionError}</ErrorMessage>}

        <ModalActions>
          <Button type="button" onClick={handleClose} style={{ backgroundColor: '#808080' }}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </ModalActions>
      </Form>
    </Modal>
  );
}
