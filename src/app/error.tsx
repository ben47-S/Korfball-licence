'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur dans un service de monitoring (optionnel)
    console.error('Error caught by error.tsx:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Une erreur est survenue
        </h1>

        <p className="text-gray-600 mb-6">
          Désolé, quelque chose s'est mal passé. Veuillez réessayer.
        </p>

        {/* Message d'erreur en mode développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200 text-left">
            <p className="text-xs font-mono text-gray-700 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={reset}
            variant="primary"
            className="flex-1"
          >
            Réessayer
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="secondary"
            className="flex-1"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
