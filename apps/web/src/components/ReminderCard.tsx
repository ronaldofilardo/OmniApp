import styled from 'styled-components';

const ReminderContainer = styled.div`
    padding: 1rem;
    background-color: #E6F4FF;
    border-left: 4px solid #1890FF;
    border-radius: 4px;
    /* Estilos mais simples para o lembrete */
`;

export function ReminderCard({ reminder }: { reminder: any }) {
    return (
        <ReminderContainer>
            <p><strong>Lembrete:</strong> {reminder.title}</p>
            <p>Data: {new Date(reminder.due_date).toLocaleDateString()}</p>
        </ReminderContainer>
    )
}
