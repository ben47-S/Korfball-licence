'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useFormData } from '../form/hooks/useFormData';

function SuccesContent() {
  const searchParams = useSearchParams();
  const numeroLicence = searchParams.get('numeroLicence');
  const isModified = searchParams.get('modified') === 'true';
  const [isMobile, setIsMobile] = useState(false);
  const { clearFormData } = useFormData();

  // Nettoyer les données du formulaire au montage de la page
  useEffect(() => {
    // Effacer les données du formulaire pour éviter qu'elles restent en cache
    clearFormData();
  }, [clearFormData]);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const copyNumeroLicence = () => {
    if (numeroLicence) {
      navigator.clipboard.writeText(numeroLicence);
      alert('Numéro de licence copié dans le presse-papier !');
    }
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
      {/* Contenu par-dessus */}
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isModified ? 'Demande modifiée avec succès !' : 'Inscription réussie !'}
          </h1>
          <p className="text-gray-600">
            {isModified
              ? 'Votre demande a été resoumise et est en cours de traitement'
              : 'Votre demande de licence a été enregistrée avec succès'
            }
          </p>
        </div>

        {numeroLicence ? (
          <Card>
            <div className="space-y-6">
              <Alert type="success" title={isModified ? "Votre demande a été resoumise" : "Votre inscription est confirmée"}>
                {isModified
                  ? "Votre demande de licence a été modifiée et resoumise. Elle est maintenant en cours de traitement."
                  : "Votre demande de licence a été soumise et est en cours de traitement."
                }
                {numeroLicence && (
                  <span className="block mt-2 font-semibold">
                    Votre numéro de licence : {numeroLicence}
                  </span>
                )}
                Vous recevrez un email de confirmation si vous avez fourni une adresse email.
              </Alert>

              {numeroLicence && (
                <div className="bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Votre numéro de licence
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Conservez précieusement ce numéro. Il vous permettra de suivre l'état de votre demande et de renouveler votre licence.
                  </p>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white p-3 rounded border border-gray-300 font-mono text-lg font-bold text-gray-900 break-all">
                      {numeroLicence}
                    </div>
                    <Button
                      onClick={copyNumeroLicence}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      Copier
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Notez ce numéro de licence dans un endroit sûr</li>
                    <li>Vous en aurez besoin pour consulter votre licence et renouveler</li>
                    <li>Si vous perdez ce numéro, contactez votre club</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Prochaines étapes
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Votre demande est actuellement <strong>en cours de traitement</strong></li>
                  <li>Un administrateur va vérifier vos informations</li>
                  <li>Vous serez notifié par email une fois votre licence validée</li>
                  <li>Vous pourrez alors procéder au paiement</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/inscription/suivi" className="flex-1">
                  <Button className="w-full">
                    Suivre ma demande
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <Alert type="error">
              Aucune information n'a été fournie. Veuillez réessayer votre inscription.
            </Alert>
            <Link href="/inscription">
              <Button className="mt-4">
                Retour au formulaire
              </Button>
            </Link>
          </Card>
        )}

        {/* Aide */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Besoin d'aide ?{' '}
            <a href="https://wa.me/" className="text-indigo-600 hover:underline">
              Contactez-nous
            </a>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccesPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SuccesContent />
    </Suspense>
  );
}
