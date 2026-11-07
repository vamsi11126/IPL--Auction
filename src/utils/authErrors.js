/**
 * Formats Firebase Auth errors into actionable, user-friendly messages.
 *
 * @param {any} error
 * @returns {string}
 */
export function formatAuthError(error) {
  if (!error) return 'Sign-in failed. Please try again.';

  const code = error.code || '';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  switch (code) {
    case 'auth/unauthorized-domain':
      if (currentHost === '127.0.0.1') {
        return 'Sign-in failed: "127.0.0.1" is not authorized in Firebase. Please open the app via "http://localhost:5173" instead, or add 127.0.0.1 in Firebase Console > Authentication > Settings > Authorized domains.';
      }
      return `Sign-in failed: Current domain (${currentHost}) is not authorized. Please add "${currentHost}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;

    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before completing authentication. Please try again.';

    case 'auth/cancelled-popup-request':
      return 'Another sign-in request was in progress. Please click once and wait for the window to load.';

    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';

    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in Firebase Console. Please enable Google under Authentication -> Sign-in method.';

    case 'auth/configuration-not-found':
      return 'Firebase OAuth configuration not found. Check your Project Support Email and Google provider settings in Firebase Console.';

    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';

    default:
      return error.message || 'Sign-in failed. Please try again.';
  }
}
