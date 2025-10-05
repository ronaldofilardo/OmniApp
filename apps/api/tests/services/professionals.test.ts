import { describe, it, expect } from 'vitest';
import * as professionalsService from '../../src/services/professionals.service';

describe('professionals.service', () => {
  describe('module exports', () => {
    it('should export all expected functions', () => {
      expect(typeof professionalsService.getProfessionals).toBe('function');
      expect(typeof professionalsService.checkProfessionalExists).toBe('function');
      expect(typeof professionalsService.createProfessional).toBe('function');
      expect(typeof professionalsService.getProfessionalById).toBe('function');
      expect(typeof professionalsService.updateProfessional).toBe('function');
      expect(typeof professionalsService.getSpecialties).toBe('function');
    });
  });

  describe('utility functions', () => {
    it('should have utility functions defined', () => {
      expect(professionalsService).toBeDefined();
      expect(Object.keys(professionalsService)).toHaveLength(6); // All exported functions
    });
  });
});