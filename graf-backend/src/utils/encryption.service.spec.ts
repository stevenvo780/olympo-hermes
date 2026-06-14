import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
    service = new EncryptionService();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'gf_1234567890_abcdef123456';

      const encrypted = service.encrypt(originalText);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toContain(':');

      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should return original text if empty or null', () => {
      expect(service.encrypt('')).toBe('');
      expect(service.encrypt(null)).toBe(null);
      expect(service.decrypt('')).toBe('');
    });

    it('should return original text if decrypt fails', () => {
      const invalidEncrypted = 'invalid:encrypted:text';
      const result = service.decrypt(invalidEncrypted);
      expect(result).toBe(invalidEncrypted);
    });

    it('should handle decrypt errors from crypto', () => {
      const crypto = require('crypto');
      const spy = jest
        .spyOn(crypto, 'createDecipheriv')
        .mockImplementation(() => {
          throw new Error('boom');
        });

      const encrypted = 'abcd1234abcd1234:deadbeef';
      const result = service.decrypt(encrypted);

      expect(result).toBe(encrypted);
      spy.mockRestore();
    });

    it('should handle text without colon separator in decrypt', () => {
      const textWithoutColon = 'sometext';
      const result = service.decrypt(textWithoutColon);
      expect(result).toBe(textWithoutColon);
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key with correct format', () => {
      const apiKey = service.generateApiKey();

      expect(apiKey).toBeDefined();
      expect(apiKey).toMatch(/^gf_\d+_[a-f0-9]{32}$/);
      expect(apiKey.startsWith('gf_')).toBe(true);
    });

    it('should generate unique API keys', () => {
      const key1 = service.generateApiKey();
      const key2 = service.generateApiKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('constructor', () => {
    it('should throw error if ENCRYPTION_KEY is not 32 characters', () => {
      process.env.ENCRYPTION_KEY = 'short';

      expect(() => new EncryptionService()).toThrow(
        'ENCRYPTION_KEY must be exactly 32 characters long',
      );
    });

    it('should throw error if ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => new EncryptionService()).toThrow(
        'ENCRYPTION_KEY must be exactly 32 characters long',
      );
    });
  });
});
