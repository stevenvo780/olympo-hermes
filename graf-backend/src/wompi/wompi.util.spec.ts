import { extractWompiErrorDetails } from './wompi.util';

describe('WompiUtil', () => {
  describe('extractWompiErrorDetails', () => {
    it('should extract error details from Wompi response with messages', () => {
      const error = {
        response: {
          data: {
            error: {
              type: 'INPUT_VALIDATION_ERROR',
              messages: {
                amount_in_cents: ['cannot be null'],
              },
            },
          },
        },
      };

      const result = extractWompiErrorDetails(error as any);
      expect(result.code).toBe('INPUT_VALIDATION_ERROR');
      expect(result.message).toContain('cannot be null');
    });

    it('should extract declined transaction details', () => {
      const error = {
        response: {
          data: {
            data: {
              status: 'DECLINED',
              status_message: 'Fondos insuficientes',
              decline_code: 'INVALID_FUNDS',
              decline_reason: 'No funds',
            },
          },
        },
      };

      const result = extractWompiErrorDetails(error as any);
      expect(result.code).toBe('DECLINED');
      expect(result.message).toBe('Fondos insuficientes');
      expect(result.details).toContain('INVALID_FUNDS');
    });

    it('should fallback when status_message or decline_reason are missing', () => {
      const error = {
        response: {
          data: {
            data: {
              status: 'DECLINED',
              decline_code: 'DECLINE',
            },
          },
        },
      };

      const result = extractWompiErrorDetails(error as any);
      expect(result.code).toBe('DECLINED');
      expect(result.message).toBe('Transacción rechazada');
      expect(result.details).toContain('No especificada');
    });

    it('should fallback to error type when messages are missing', () => {
      const error = {
        response: {
          data: {
            error: {
              type: 'INPUT_VALIDATION_ERROR',
            },
          },
        },
      };

      const result = extractWompiErrorDetails(error as any);
      expect(result.code).toBe('INPUT_VALIDATION_ERROR');
      expect(result.message).toBe('INPUT_VALIDATION_ERROR');
    });

    it('should return API error details when response has generic message', () => {
      const error = {
        response: {
          data: {
            message: 'Generic API error',
          },
        },
      };

      const result = extractWompiErrorDetails(error as any);
      expect(result.code).toBe('API_ERROR');
      expect(result.message).toBe('Generic API error');
    });

    it('should fallback to default API error message when none provided', () => {
      const error = {
        response: {
          data: {
            extra: 'info',
          },
        },
      };

      const result = extractWompiErrorDetails(error as any);
      expect(result.code).toBe('API_ERROR');
      expect(result.message).toBe('Error en la API de Wompi');
    });

    it('should handle unknown errors', () => {
      const error = { message: 'Network Error' };
      const result = extractWompiErrorDetails(error as any);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Network Error');
    });

    it('should use error.code when message is missing', () => {
      const error = { code: 'ECONN' };
      const result = extractWompiErrorDetails(error as any);

      expect(result.code).toBe('ECONN');
      expect(result.message).toBe(
        'Error desconocido al procesar la transacción',
      );
    });
  });
});
