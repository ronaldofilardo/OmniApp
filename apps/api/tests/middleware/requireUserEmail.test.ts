import { describe, it, expect, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/mocks';
import { requireUserEmail } from '../../src/middleware/requireUserEmail';

describe('requireUserEmail Middleware', () => {
  describe('without JWT (current implementation)', () => {
    it('should allow all requests', () => {
      // Arrange
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      requireUserEmail(req as any, res as any, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow requests without headers', () => {
      // Arrange
      const req = createMockRequest({ headers: {} });
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      requireUserEmail(req as any, res as any, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should allow public paths', () => {
      // Arrange
      const paths = ['/health', '/status', '/users/login'];
      
      paths.forEach(path => {
        const req = createMockRequest({ path });
        const res = createMockResponse();
        const next = createMockNext();

        // Act
        requireUserEmail(req as any, res as any, next);

        // Assert
        expect(next).toHaveBeenCalled();
      });
    });
  });
});
