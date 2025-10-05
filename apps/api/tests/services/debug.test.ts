import { describe, it, expect } from 'vitest';
import * as debugService from '../../src/services/debug.service';

describe('debug.service', () => {
  describe('module exports', () => {
    it('should export all expected functions', () => {
      expect(typeof debugService.getSharingSessionsForDebug).toBe('function');
    });
  });

  describe('utility functions', () => {
    it('should have utility functions defined', () => {
      expect(debugService).toBeDefined();
      expect(Object.keys(debugService)).toHaveLength(1); // All exported functions
    });
  });
});