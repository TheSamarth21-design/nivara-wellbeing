export function getAuthErrorMessage(error: any): string {
  const code = typeof error === 'string' ? error : error?.code || '';
  const message = error?.message || (typeof error === 'string' ? error : '');
  const combined = `${code} ${message}`.toLowerCase();

  if (combined.includes('weak-password') || combined.includes('weak_password') || combined.includes('at least 6 characters')) {
    return 'Password must be at least 6 characters long (Firebase requirement).';
  }

  if (combined.includes('operation-not-allowed') || combined.includes('operation_not_allowed')) {
    return 'Email/Password sign-in is not enabled in Firebase Console. Please go to Firebase Console > Authentication > Sign-in method and enable Email/Password.';
  }

  if (combined.includes('email-already-in-use') || combined.includes('email_exists')) {
    return 'An account with this email address already exists. Please switch to Sign In below.';
  }

  if (
    combined.includes('invalid-credential') ||
    combined.includes('invalid_login_credentials') ||
    combined.includes('user-not-found') ||
    combined.includes('wrong-password')
  ) {
    return 'Invalid email or password. If you do not have an account yet, click "Create one" below.';
  }

  if (combined.includes('invalid-email') || combined.includes('invalid_email')) {
    return 'Please enter a valid email address.';
  }

  if (combined.includes('too-many-requests') || combined.includes('too_many_attempts')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (combined.includes('network-request-failed')) {
    return 'Network connection error. Please check your internet connection.';
  }

  if (combined.includes('popup-closed-by-user')) {
    return 'Sign in was cancelled.';
  }

  if (error?.message && !error.message.includes('Firebase:')) {
    return error.message;
  }

  return 'Authentication failed. Please verify your details (password must be at least 6 characters) and try again.';
}
