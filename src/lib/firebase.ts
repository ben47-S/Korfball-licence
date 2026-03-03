/**
 * Configuration Firebase Admin SDK
 */
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

let firebaseApp: App | undefined;

export function getFirebaseApp(): App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    return firebaseApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY est manquante. ' +
      'Voir docs/FIREBASE_SETUP.md pour la configuration.'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (error) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY doit être un JSON valide. ' +
      'Erreur: ' + (error instanceof Error ? error.message : 'Unknown error')
    );
  }

  firebaseApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || serviceAccount.project_id + '.appspot.com',
  });

  return firebaseApp;
}

export function getFirebaseStorageBucket() {
  const app = getFirebaseApp();
  return getStorage(app).bucket();
}







