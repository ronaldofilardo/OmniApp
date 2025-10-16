import { describe, it, expect } from 'vitest';
import * as filesService from '../../src/services/files.service';

describe('files.service', () => {
  describe('module exports', () => {
    it('should export all expected functions', () => {
      expect(typeof filesService.getFilesForEvent).toBe('function');
      expect(typeof filesService.uploadFile).toBe('function');
      expect(typeof filesService.markFileAsViewed).toBe('function');
      expect(typeof filesService.deleteFile).toBe('function');
    });
  });

  describe('utility functions', () => {
    it('should have utility functions defined', () => {
      expect(filesService).toBeDefined();
      expect(Object.keys(filesService)).toHaveLength(6); // All exported functions
    });
  });
});