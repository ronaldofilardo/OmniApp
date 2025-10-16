import { describe, it, expect } from 'vitest';
import * as eventsService from '../../src/services/events.service';

describe('events.service', () => {
  describe('module exports', () => {
    it('should export all expected functions', () => {
      expect(typeof eventsService.getTimeline).toBe('function');
      expect(typeof eventsService.checkConflicts).toBe('function');
      expect(typeof eventsService.createEvent).toBe('function');
      expect(typeof eventsService.getEvents).toBe('function');
      expect(typeof eventsService.getEventsByPeriod).toBe('function');
      expect(typeof eventsService.updateEvent).toBe('function');
      expect(typeof eventsService.getEventById).toBe('function');
      expect(typeof eventsService.deleteEvent).toBe('function');
      expect(typeof eventsService.generateUploadCode).toBe('function');
    });
  });

  describe('utility functions', () => {
    it('should have utility functions defined', () => {
      // Test that the module can be imported without errors
      expect(eventsService).toBeDefined();
      expect(Object.keys(eventsService)).toHaveLength(11); // All exported functions (atualizado de 9 para 11)
    });
  });
});