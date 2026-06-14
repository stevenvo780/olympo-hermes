import { User } from './user.entity';
import { EncryptionService } from '../../utils/encryption.service';

jest.mock('../../utils/encryption.service');

describe('User Entity', () => {
  let user: User;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    user = new User();
    encryptionService = new EncryptionService();
    (EncryptionService as jest.Mock).mockReturnValue(encryptionService);
    (encryptionService.encrypt as jest.Mock).mockImplementation(
      (val) => `encrypted:${val}`,
    );
    (encryptionService.decrypt as jest.Mock).mockImplementation((val) =>
      val.replace('encrypted:', ''),
    );
  });

  describe('encryptCredentials', () => {
    it('should encrypt plain text credentials', () => {
      user.apiKey = 'plain-key';
      user.sigoApiKey = 'plain-sigo';
      user.sigoEmail = 'plain-email';
      user.sigoPassword = 'plain-pass';
      user.hubspotAccessToken = 'plain-token';
      user.hubspotApiKey = 'plain-hub-key';

      user.encryptCredentials();

      expect(user.apiKey).toBe('encrypted:plain-key');
      expect(user.sigoApiKey).toBe('encrypted:plain-sigo');
      expect(user.sigoEmail).toBe('encrypted:plain-email');
      expect(user.sigoPassword).toBe('encrypted:plain-pass');
      expect(user.hubspotAccessToken).toBe('encrypted:plain-token');
      expect(user.hubspotApiKey).toBe('encrypted:plain-hub-key');
    });

    it('should not re-encrypt already encrypted credentials', () => {
      user.apiKey = 'encrypted:key';
      user.sigoApiKey = 'encrypted:sigo';
      user.encryptCredentials();
      expect(user.apiKey).toBe('encrypted:key');
      expect(user.sigoApiKey).toBe('encrypted:sigo');
    });

    it('should delegate encryptApiKey to encryptCredentials', () => {
      const spy = jest.spyOn(user, 'encryptCredentials');
      user.encryptApiKey();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getDecryptedApiKey', () => {
    it('should decrypt api key', () => {
      user.apiKey = 'encrypted:key';
      expect(user.getDecryptedApiKey()).toBe('key');
    });

    it('should return null if no api key', () => {
      user.apiKey = null;
      expect(user.getDecryptedApiKey()).toBeNull();
    });

    it('should return null on error', () => {
      user.apiKey = 'encrypted:key';
      (encryptionService.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error();
      });
      expect(user.getDecryptedApiKey()).toBeNull();
    });
  });

  describe('getSigoCredentials', () => {
    it('should return decrypted credentials', () => {
      user.sigoApiKey = 'encrypted:key';
      user.sigoEmail = 'encrypted:email';
      user.sigoPassword = 'encrypted:pass';
      user.sigoApiUrl = 'http://api';

      const creds = user.getSigoCredentials();
      expect(creds.apiKey).toBe('key');
      expect(creds.email).toBe('email');
      expect(creds.password).toBe('pass');
      expect(creds.apiUrl).toBe('http://api');
    });

    it('should use default api url when none is set', () => {
      user.sigoApiKey = 'encrypted:key';
      user.sigoEmail = 'encrypted:email';

      const creds = user.getSigoCredentials();

      expect(creds.apiUrl).toBe('https://api.siigo.com');
    });

    it('should return undefined fields when credentials are missing', () => {
      const creds = user.getSigoCredentials();

      expect(creds.apiKey).toBeUndefined();
      expect(creds.email).toBeUndefined();
      expect(creds.password).toBeUndefined();
      expect(creds.apiUrl).toBe('https://api.siigo.com');
    });

    it('should return empty object on error', () => {
      user.sigoApiKey = 'encrypted:key';
      (encryptionService.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error();
      });
      expect(user.getSigoCredentials()).toEqual({});
    });
  });

  describe('getHubSpotCredentials', () => {
    it('should return decrypted credentials', () => {
      user.hubspotAccessToken = 'encrypted:token';
      user.hubspotApiKey = 'encrypted:key';
      user.hubspotApiUrl = 'http://api';

      const creds = user.getHubSpotCredentials();
      expect(creds.accessToken).toBe('token');
      expect(creds.apiKey).toBe('key');
      expect(creds.apiUrl).toBe('http://api');
    });

    it('should use default api url when none is set', () => {
      user.hubspotAccessToken = 'encrypted:token';

      const creds = user.getHubSpotCredentials();

      expect(creds.apiUrl).toBe('https://api.hubapi.com');
    });

    it('should return undefined fields when credentials are missing', () => {
      const creds = user.getHubSpotCredentials();

      expect(creds.accessToken).toBeUndefined();
      expect(creds.apiKey).toBeUndefined();
      expect(creds.apiUrl).toBe('https://api.hubapi.com');
    });

    it('should return empty object on error', () => {
      user.hubspotAccessToken = 'encrypted:token';
      (encryptionService.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error();
      });
      expect(user.getHubSpotCredentials()).toEqual({});
    });
  });

  describe('credential helpers', () => {
    it('should report credential presence', () => {
      user.sigoApiKey = 'encrypted:key';
      user.sigoEmail = 'encrypted:email';
      user.hubspotApiKey = 'encrypted:hub';

      expect(user.hasSigoCredentials()).toBe(true);
      expect(user.hasHubSpotCredentials()).toBe(true);

      user.sigoEmail = null;
      user.hubspotApiKey = null;

      expect(user.hasSigoCredentials()).toBe(false);
      expect(user.hasHubSpotCredentials()).toBe(false);
    });
  });

  describe('toSafeJSON', () => {
    it('should return object without sensitive keys', () => {
      user.apiKey = 'key';
      user.sigoPassword = 'pass';

      const safe = user.toSafeJSON();
      expect(safe.apiKey).toBeUndefined();
      expect(safe.sigoPassword).toBeUndefined();
      expect(safe.hasSigoCredentials).toBe(false);
    });

    it('should include credential flags', () => {
      user.sigoApiKey = 'encrypted:key';
      user.sigoEmail = 'encrypted:email';
      user.hubspotAccessToken = 'encrypted:token';

      const safe = user.toSafeJSON();

      expect(safe.hasSigoCredentials).toBe(true);
      expect(safe.hasHubSpotCredentials).toBe(true);
    });
  });
});
