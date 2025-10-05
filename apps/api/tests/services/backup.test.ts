import { describe, it, expect } from 'vitest';
import * as backupService from '../../src/services/backup.service';

describe('backup.service', () => {
  describe('module exports', () => {
    it('should export all expected functions', () => {
      expect(typeof backupService.generateDataBackup).toBe('function');
      expect(typeof backupService.generateFilesBackup).toBe('function');
    });
  });

  describe('utility functions', () => {
    it('should have utility functions defined', () => {
      expect(backupService).toBeDefined();
      expect(Object.keys(backupService)).toHaveLength(2); // All exported functions
    });
  });
});