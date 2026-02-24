/**
 * Utility function to merge class names
 * Combines multiple class strings and filters out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formate un numéro de téléphone (uniquement les 10 chiffres)
 * - Supprime tous les caractères non numériques
 * - Limite à 10 chiffres
 * - Utilisé avec le préfixe +225 affiché séparément
 */
export function formatTelephone(value: string): string {
  // Supprimer tous les caractères non numériques
  const cleaned = value.replace(/\D/g, '');
  // Limiter à 10 chiffres
  return cleaned.slice(0, 10);
}

/**
 * Valide un numéro de téléphone (10 chiffres uniquement)
 * Le préfixe +225 est géré séparément dans le formulaire
 * @returns true si valide (exactement 10 chiffres), false sinon
 */
export function validateTelephone(value: string): boolean {
  // Accepter soit le format complet +225XXXXXXXXXX, soit juste les 10 chiffres
  const phoneRegex = /^(\+225\d{10}|\d{10})$/;
  return phoneRegex.test(value);
}

/**
 * Convertit un numéro de téléphone (10 chiffres) en format complet +225XXXXXXXXXX
 * @param value - Les 10 chiffres du numéro
 * @returns Le numéro au format +225XXXXXXXXXX
 */
export function formatTelephoneComplete(value: string): string {
  // Nettoyer et limiter à 10 chiffres
  const cleaned = value.replace(/\D/g, '').slice(0, 10);
  if (cleaned.length === 10) {
    return `+225${cleaned}`;
  }
  return value.startsWith('+225') ? value : `+225${cleaned}`;
}

/**
 * Génère un numéro de licence unique au format FIK-YYYY-XXXXXX
 * où YYYY est l'année courante et XXXXXX est un nombre aléatoire à 6 chiffres
 * @returns Un numéro de licence au format "FIK-2024-123456"
 */
export function genererNumeroLicence(): string {
  const annee = new Date().getFullYear();
  // Générer un nombre aléatoire à 6 chiffres (100000 à 999999)
  const nombreAleatoire = Math.floor(Math.random() * 900000) + 100000;
  return `FIK-${annee}-${nombreAleatoire}`;
}