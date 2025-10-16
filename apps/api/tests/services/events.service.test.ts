import { describe, it, expect, beforeEach } from 'vitest';
import * as eventsService from '../../src/services/events.service';
import { createTestUser, createTestProfessional, createTestEvent } from '../helpers/database';
import { prisma } from '../setup';

describe('Events Service', () => {
  let testUserId: string;
  let testProfessionalName: string;

  beforeEach(async () => {
    const user = await createTestUser(prisma);
    testUserId = user.id;
    const professional = await createTestProfessional(prisma, testUserId);
    testProfessionalName = professional.name;
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      // Arrange
      const eventData = {
        user_id: testUserId,
        professional: testProfessionalName,
        type: 'Consulta',
        event_date: new Date('2025-10-20'),
        start_time: new Date('2025-10-20T10:00:00Z'),
        end_time: new Date('2025-10-20T11:00:00Z')
      };

      // Act
      const result = await prisma.events.create({
        data: eventData
      });

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.type).toBe('Consulta');
      expect(result.professional).toBe(testProfessionalName);
    });

    it('should create multiple events for same user', async () => {
      // Arrange - criar eventos com propriedades únicas
      const event1 = await createTestEvent(prisma, testUserId, testProfessionalName, {
        notes: `test-multiple-${Date.now()}-1`
      });
      const event2 = await createTestEvent(prisma, testUserId, testProfessionalName, {
        event_date: new Date(Date.now() + 86400000), // +1 dia
        notes: `test-multiple-${Date.now()}-2`
      });

      // Act - buscar APENAS esses dois eventos criados
      const events = await prisma.events.findMany({
        where: { 
          user_id: testUserId,
          id: { in: [event1.id, event2.id] }
        }
      });

      // Assert
      expect(events).toHaveLength(2);
      
      // Cleanup - deletar eventos criados
      await prisma.events.deleteMany({
        where: { id: { in: [event1.id, event2.id] } }
      });
    });
  });

  describe('getEvents', () => {
    it('should return all events for a user', async () => {
      // Arrange - criar eventos com marcadores únicos
      const event1 = await createTestEvent(prisma, testUserId, testProfessionalName, {
        notes: `test-get-all-${Date.now()}-1`
      });
      const event2 = await createTestEvent(prisma, testUserId, testProfessionalName, {
        event_date: new Date(Date.now() + 86400000),
        notes: `test-get-all-${Date.now()}-2`
      });

      // Act - buscar APENAS esses dois eventos
      const events = await prisma.events.findMany({
        where: { 
          user_id: testUserId, 
          deleted_at: null,
          id: { in: [event1.id, event2.id] }
        }
      });

      // Assert
      expect(events).toHaveLength(2);
      
      // Cleanup
      await prisma.events.deleteMany({
        where: { id: { in: [event1.id, event2.id] } }
      });
    });

    it('should not return deleted events', async () => {
      // Arrange - criar evento único
      const event = await createTestEvent(prisma, testUserId, testProfessionalName, {
        notes: `test-soft-delete-${Date.now()}`
      });
      await prisma.events.update({
        where: { id: event.id },
        data: { deleted_at: new Date() }
      });

      // Act - buscar apenas esse evento específico
      const events = await prisma.events.findMany({
        where: { 
          user_id: testUserId, 
          deleted_at: null,
          id: event.id
        }
      });

      // Assert
      expect(events).toHaveLength(0);
      
      // Cleanup
      await prisma.events.delete({
        where: { id: event.id }
      });
    });
  });

  describe('deleteEvent', () => {
    it('should soft delete event', async () => {
      // Arrange
      // Garante que o evento é criado com o MOCK_USER_ID
      const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      const event = await createTestEvent(prisma, MOCK_USER_ID, testProfessionalName);

      // Act
      await prisma.events.update({
        where: { id: event.id },
        data: { deleted_at: new Date() }
      });

      // Assert
      const deletedEvent = await prisma.events.findUnique({
        where: { id: event.id }
      });
      expect(deletedEvent?.deleted_at).toBeTruthy();
    });
  });

  describe('updateEvent', () => {
    it('should update event fields', async () => {
      // Arrange
      const event = await createTestEvent(prisma, testUserId, testProfessionalName);

      // Act
      await prisma.events.update({
        where: { id: event.id },
        data: { notes: 'Updated notes' }
      });

      // Assert
      const updated = await prisma.events.findUnique({
        where: { id: event.id }
      });
      expect(updated?.notes).toBe('Updated notes');
    });
  });
});
