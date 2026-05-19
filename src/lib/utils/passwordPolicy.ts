/**
 * Password Policy Utility
 * -----------------------
 * Centralise les règles de validation des mots de passe.
 * Utiliser dans toutes les routes qui créent ou modifient un mot de passe.
 */

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Valide un mot de passe selon la politique de l'application.
 * @returns null si valide, sinon le message d'erreur
 */
export function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') {
    return 'Le mot de passe est requis.';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre majuscule.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un chiffre.';
  }
  return null; // valide
}
