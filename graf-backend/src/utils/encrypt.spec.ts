import { encrypt, decrypt } from './encrypt';

describe('Encryption Utils', () => {
  const secret = 'super-secret-key';
  const data = 'some sensitive data';

  describe('encrypt', () => {
    it('should encrypt data', () => {
      const encrypted = encrypt(data, secret);
      expect(encrypted).not.toBe(data);
      expect(encrypted).toContain(':');
    });

    it('should throw error if no data provided', () => {
      expect(() => encrypt('', secret)).toThrow('No data provided');
    });

    it('should throw error if no secret provided', () => {
      expect(() => encrypt(data, undefined)).toThrow('No secret provided');
    });
  });

  describe('decrypt', () => {
    it('should decrypt data', () => {
      const encrypted = encrypt(data, secret);
      const decrypted = decrypt(encrypted, secret);
      expect(decrypted).toBe(data);
    });

    it('should throw error if no encrypted data provided', () => {
      expect(() => decrypt('', secret)).toThrow('No encrypted data provided');
    });

    it('should throw error if no secret provided', () => {
      const encrypted = encrypt(data, secret);
      expect(() => decrypt(encrypted, undefined)).toThrow('No secret provided');
    });

    it('should fail to decrypt correctly with wrong secret', () => {
      const encrypted = encrypt(data, secret);
      try {
        const decrypted = decrypt(encrypted, 'wrong-secret');
        expect(decrypted).not.toBe(data);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should throw error if malformed encrypted string', () => {
      expect(() => decrypt('not-hex:not-hex', secret)).toThrow();
    });
  });
});
