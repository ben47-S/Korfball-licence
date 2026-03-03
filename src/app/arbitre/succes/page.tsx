'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function ArbitreSuccesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const numeroLicence = searchParams.get('numeroLicence');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Nettoyer le localStorage après succès
  useEffect(() => {
    localStorage.removeItem('arbitre_form_data');
  }, []);

  const handleRetourAccueil = () => {
    router.push('/');
  };

  const handleNouvelleInscription = () => {
    router.push('/arbitre/form/new');
  };

  return (
    <div className="min-h-screen bg-white relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo en arrière-plan */}
      <div
        className="fixed inset-0 opacity-20 md:opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/images/korfball.png)',
          backgroundSize: '85%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Contenu */}
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <svg
                className="w-16 h-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Inscription réussie !
            </h1>
            <p className="text-lg text-gray-600">
              Votre demande de licence arbitre a été soumise avec succès
            </p>
          </div>

          <Card>
            <div className="space-y-6">
              {numeroLicence && (
                <Alert type="success">
                  <div className="space-y-2">
                    <p className="font-semibold text-lg">
                      Votre numéro de licence
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {numeroLicence}
                    </p>
                    <p className="text-sm text-gray-600">
                      Conservez précieusement ce numéro. Il vous sera demandé pour suivre votre dossier.
                    </p>
                  </div>
                </Alert>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  Prochaines étapes
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li>
                    Votre demande est <strong>en attente de validation</strong> par un administrateur
                  </li>
                  <li>
                    Vous recevrez un email de confirmation une fois votre licence validée
                  </li>
                  <li>
                    Vous pourrez alors procéder au paiement de votre licence
                  </li>
                  <li>
                    Une fois le paiement effectué, votre licence sera activée
                  </li>
                </ol>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">
                  Suivre votre demande
                </h3>
                <p className="text-gray-700 mb-4">
                  Vous pouvez suivre l'état de votre demande à tout moment en utilisant :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Votre numéro de licence : <strong>{numeroLicence || 'N/A'}</strong></li>
                  <li>Votre date de naissance</li>
                  <li>Votre numéro de téléphone</li>
                </ul>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Informations importantes
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Le délai de traitement est généralement de 2 à 5 jours ouvrables</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Vérifiez régulièrement votre boîte email (y compris les spams)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>En cas de rejet, vous pourrez modifier et resoumettre votre demande</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button onClick={handleRetourAccueil} variant="secondary" className="flex-1">
                  Retour à l'accueil
                </Button>
                <Button onClick={handleNouvelleInscription} className="flex-1">
                  Nouvelle inscription
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
