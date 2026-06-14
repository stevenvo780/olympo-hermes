/**
 * Traduce los códigos de error de Firebase Authentication a mensajes en español
 * amigables para el usuario.
 */

const firebaseErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Este correo ya está registrado. Intenta iniciar sesión.',
  'auth/invalid-email': 'El formato del correo electrónico no es válido.',
  'auth/operation-not-allowed': 'Este método de registro no está habilitado.',
  'auth/weak-password': 'La contraseña es muy débil. Usa al menos 8 caracteres.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta al soporte.',
  'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Las credenciales son inválidas. Verifica tu correo y contraseña.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de inicio de sesión antes de completar el proceso.',
  'auth/cancelled-popup-request': 'Se canceló la solicitud de inicio de sesión.',
  'auth/popup-blocked': 'Tu navegador bloqueó la ventana emergente. Permite las ventanas emergentes e intenta de nuevo.',
  'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo pero con otro método de inicio de sesión.',
  'auth/requires-recent-login': 'Por seguridad, necesitas iniciar sesión de nuevo antes de realizar esta acción.',
  'auth/credential-already-in-use': 'Esta credencial ya está asociada a otra cuenta.',
  'auth/invalid-verification-code': 'El código de verificación no es válido.',
  'auth/invalid-verification-id': 'El ID de verificación no es válido.',
  'auth/missing-verification-code': 'Falta el código de verificación.',
  'auth/missing-verification-id': 'Falta el ID de verificación.',
};

/**
 * Extrae el código de error de Firebase de un error.
 * Firebase puede lanzar errores con la estructura { code: 'auth/...', message: '...' }
 * o con el formato "Firebase: Error (auth/...)".
 */
function extractFirebaseErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.code === 'string') {
      return err.code;
    }
    if (typeof err.message === 'string') {
      const match = err.message.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  return null;
}

/**
 * Traduce un error de Firebase a un mensaje amigable en español.
 * Si no se reconoce el código, devuelve el fallback proporcionado.
 */
export function getFirebaseErrorMessage(error: unknown, fallback = 'Ha ocurrido un error. Intenta de nuevo.'): string {
  const code = extractFirebaseErrorCode(error);
  if (code && firebaseErrorMessages[code]) {
    return firebaseErrorMessages[code];
  }
  return fallback;
}

/**
 * Verifica si el error de Firebase es de tipo "email ya en uso".
 */
export function isEmailAlreadyInUseError(error: unknown): boolean {
  const code = extractFirebaseErrorCode(error);
  return code === 'auth/email-already-in-use';
}
