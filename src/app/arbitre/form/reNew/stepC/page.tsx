'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import ImageCapture from '@/components/ui/ImageCapture';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { useFormData } from '../../hooks/useFormData';
import StepIndicator from '../../components/StepIndicator';
import { formatTelephoneComplete } from '@/lib/utils';

export default function RenewStepCPage() {
  const router = useRouter();
  const { isLoaded, executeRecaptcha } = useRecaptcha();
  const { formData, updateFormData, clearFormData, isHydrated } = useFormData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

  // Rediriger si les étapes précédentes ne sont pas complétées
  useEffect(() => {
    if (!isHydrated || isLoading) return;

    if (!formData.type || !formData.saisonId) {
      router.replace('/arbitre/form/reNew/stepA');
      return;
    }
    if (!formData.arbitre.nom || !formData.arbitre.prenom || !formData.arbitre.dateNaissance) {
      router.replace('/arbitre/form/reNew/stepB');
      return;
    }
  }, [isHydrated, isLoading, formData.type, formData.saisonId, formData.arbitre.nom, formData.arbitre.prenom, formData.arbitre.dateNaissance, router]);

  const handleBack = () => {
    router.push('/arbitre/form/reNew/stepB');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Pour le renouvellement, les documents peuvent être optionnels si déjà présents
    // Mais on peut demander de nouveaux documents si nécessaire

    try {
      const recaptchaToken = await executeRecaptcha('inscription');

      // Formater le téléphone au format complet +225XXXXXXXXXX avant l'envoi
      const payload = {
        ...formData,
        arbitre: {
          ...formData.arbitre,
          telephone: formatTelephoneComplete(formData.arbitre.telephone),
        },
        numeroLicencePrecedent: formData.numeroLicencePrecedent,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (recaptchaToken) {
        headers['x-recaptcha-token'] = recaptchaToken;
      }

      const response = await fetch('/api/arbitres/inscriptions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      // Rediriger vers la page de succès
      const params = new URLSearchParams();
      if (data.numeroLicence) params.append('numeroLicence', data.numeroLicence);
      router.push(`/arbitre/succes?${params.toString()}`);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Une erreur est survenue');
      setIsLoading(false);
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
            Renouvellement de Licence Arbitre Korfball
          </h1>
        </div>

        <StepIndicator currentStep="stepC" type="reNew" />

        {error && (
          <div className="mb-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Étape 3 : Documents
              </h2>

              <Alert type="info">
                <p className="text-sm">
                  Pour le renouvellement, vous pouvez mettre à jour vos documents si nécessaire.
                  Les documents existants seront conservés si vous ne les modifiez pas.
                </p>
              </Alert>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pièce d'identité
                      </label>
                      <ImageCapture
                        value={formData.arbitre.pieceIdentite}
                        onChange={(value) => updateFormData({ arbitre: { ...formData.arbitre, pieceIdentite: value } })}
                        placeholder="Prendre une photo de votre pièce d'identité (optionnel pour renouvellement)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificat médical
                      </label>
                      <ImageCapture
                        value={formData.arbitre.certificatMedical}
                        onChange={(value) => updateFormData({ arbitre: { ...formData.arbitre, certificatMedical: value } })}
                        placeholder="Prendre une photo de votre certificat médical (optionnel pour renouvellement)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photo
                      </label>
                      <ImageCapture
                        value={formData.arbitre.photo}
                        onChange={(value) => updateFormData({ arbitre: { ...formData.arbitre, photo: value } })}
                        placeholder="Prendre une photo de vous (optionnel)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Signature
                      </label>
                      <ImageCapture
                        value={formData.arbitre.signature}
                        onChange={(value) => updateFormData({ arbitre: { ...formData.arbitre, signature: value } })}
                        placeholder="Prendre une photo de votre signature (optionnel)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button onClick={handleBack} type="button" variant="secondary" disabled={isLoading}>
                  ← Retour
                </Button>
                <Button type="submit" isLoading={isLoading} disabled={!isLoaded}>
                  {isLoading ? 'Envoi en cours...' : 'Soumettre le renouvellement'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
        </div>
      </div>
    </div>
  );
}

