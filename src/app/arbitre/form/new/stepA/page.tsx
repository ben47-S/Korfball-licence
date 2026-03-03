'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/date-utils';
import { useFormData } from '../../hooks/useFormData';
import StepIndicator from '../../components/StepIndicator';
import type { Saison } from '../../types';

export default function StepAPage() {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();
  const [error, setError] = useState('');
  const [saisonEnCours, setSaisonEnCours] = useState<Saison | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Réinitialiser et s'assurer que le type est NOUVEAU
  useEffect(() => {
    if (formData.type !== 'NOUVEAU') {
      updateFormData({ type: 'NOUVEAU' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    // S'assurer que le type est bien NOUVEAU
    if (formData.type !== 'NOUVEAU') {
      updateFormData({ type: 'NOUVEAU' });
    }

    const loadData = async () => {
      try {
        setLoadingData(true);
        setError('');

        const saisonResponse = await fetch('/api/saisons?enCours=true');
        if (saisonResponse.ok && isMounted) {
          const saisonData = await saisonResponse.json();
          if (saisonData.data && saisonData.data.length > 0) {
            const saison = saisonData.data[0];
            setSaisonEnCours(saison);
            // Mettre à jour les données du formulaire
            updateFormData({ saisonId: saison.id, type: 'NOUVEAU' });
          } else {
            setSaisonEnCours(null);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        if (isMounted) {
          setError('Impossible de charger les données. Veuillez rafraîchir la page.');
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    // Vérifier que les données sont chargées
    if (loadingData) {
      setError('Chargement des données en cours...');
      return;
    }

    if (!saisonEnCours) {
      setError('Aucune saison en cours disponible');
      return;
    }

    if (!formData.type || formData.type !== 'NOUVEAU') {
      setError('Cette page est réservée aux nouveaux arbitres');
      return;
    }

    // S'assurer que saisonId est bien défini avant de naviguer
    const saisonIdToUse = formData.saisonId || saisonEnCours?.id;
    if (!saisonIdToUse) {
      setError('Erreur : la saison n\'a pas été correctement chargée. Veuillez rafraîchir la page.');
      return;
    }

    // Mettre à jour les données si nécessaire avant de naviguer
    if (!formData.saisonId && saisonEnCours?.id) {
      updateFormData({ saisonId: saisonEnCours.id, type: 'NOUVEAU' });
    }

    setError('');
    setTimeout(() => {
      router.replace('/arbitre/form/new/stepB');
    }, 100);
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
            Inscription Licence Arbitre Korfball
            {saisonEnCours && (
              <span className="block text-2xl text-purple-600 mt-2">
                Saison {saisonEnCours.code}
              </span>
            )}
          </h1>
          <p className="text-purple-900 text-4xl font-bold">
            Nouvelle licence
          </p>
        </div>

        {!loadingData && !saisonEnCours && (
          <div className="mb-6">
            <Alert type="warning">
              <strong>Aucune saison en cours disponible</strong>
              <br />
              Les inscriptions ne sont pas ouvertes pour le moment. Veuillez contacter un administrateur.
            </Alert>
          </div>
        )}

        <StepIndicator currentStep="stepA" type="new" />

        {error && (
          <div className="mb-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {!loadingData && saisonEnCours && (
          <Card>
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Étape 1 : Informations générales
              </h2>

              {/* Type de licence fixé à NOUVEAU pour cette route */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de licence
                </label>
                <div className="text-lg font-semibold text-purple-900">
                  Nouvelle licence
                </div>
              </div>

              {saisonEnCours && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saison
                  </label>
                  <div className="text-lg font-semibold text-purple-900">
                    {saisonEnCours.code}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Période d'inscription : du {formatDate(saisonEnCours.inscriptionDebut)} au{' '}
                    {formatDate(saisonEnCours.inscriptionFin)}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleNext} type="button">
                  Suivant →
                </Button>
              </div>
            </div>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}

