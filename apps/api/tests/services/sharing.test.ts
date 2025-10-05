import { describe, it, expect } from 'vitest';
import * as sharingService from '../../src/services/sharing.service';

describe('sharing.service', () => {
  describe('module exports', () => {
    it('should export all expected functions', () => {
      expect(typeof sharingService.generateSharingSession).toBe('function');
      expect(typeof sharingService.verifySharingSession).toBe('function');
      expect(typeof sharingService.getSharedFiles).toBe('function');
      expect(typeof sharingService.getSharingSessionsForDebug).toBe('function');
    });
  });

  describe('utility functions', () => {
    it('should have utility functions defined', () => {
      expect(sharingService).toBeDefined();
      expect(Object.keys(sharingService)).toHaveLength(4); // All exported functions
    });
  });
});