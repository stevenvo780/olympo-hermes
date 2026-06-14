export function extractWompiErrorDetails(
  error: Error & {
    response?: { data?: Record<string, unknown> };
    code?: string;
  },
): {
  code: string;
  message: string;
  details?: string;
} {
  if (error.response?.data) {
    const errorData = error.response.data as Record<string, unknown>;

    if ((errorData.error as Record<string, unknown>)?.type) {
      const errorType = (errorData.error as Record<string, unknown>)
        .type as string;
      let errorMessage = errorType;
      const errorObj = errorData.error as Record<string, unknown>;
      if (errorObj.messages) {
        const messages = Object.values(
          errorObj.messages as Record<string, unknown>,
        )
          .flat()
          .join('; ');
        if (messages) {
          errorMessage = messages;
        }
      }
      return {
        code: errorType,
        message: errorMessage,
        details: JSON.stringify(errorData.error),
      };
    }

    if ((errorData.data as Record<string, unknown>)?.status) {
      const transactionData = errorData.data as Record<string, unknown>;
      return {
        code: transactionData.status as string,
        message:
          (transactionData.status_message as string) || 'Transacción rechazada',
        details: `Código de rechazo: ${transactionData.decline_code}, Razón: ${
          (transactionData.decline_reason as string) || 'No especificada'
        }`,
      };
    }

    return {
      code: 'API_ERROR',
      message: (errorData.message as string) || 'Error en la API de Wompi',
      details: JSON.stringify(errorData),
    };
  }
  return {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'Error desconocido al procesar la transacción',
  };
}
