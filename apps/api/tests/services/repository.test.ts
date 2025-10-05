import { describe, it, expect } from 'vitest';
import * as repositoryService from '../../src/services/repository.service';

describe('repository.service', () => {
  describe('module exports', () => {
    it('should export all expected functions', () => {
      expect(typeof repositoryService.getOrphanFiles).toBe('function');
      expect(typeof repositoryService.getRepositoryEvents).toBe('function');
      expect(typeof repositoryService.confirmDeleteEvent).toBe('function');
      expect(typeof repositoryService.restoreEvent).toBe('function');
    });
  });

  describe('utility functions', () => {
    it('should have utility functions defined', () => {
      expect(repositoryService).toBeDefined();
      expect(Object.keys(repositoryService)).toHaveLength(4); // All exported functions
    });
  });
});