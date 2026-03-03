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

export default function StepCPage() {
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
      router.replace('/arbitre/form/new/stepA');
      return;
    }
    if (!formData.arbitre.nom || !formData.arbitre.prenom || !formData.arbitre.dateNaissance) {
      router.replace('/arbitre/form/new/stepB');
      return;
    }
  }, [isHydrated, isLoading, formData.type, formData.saisonId, formData.arbitre.nom, formData.arbitre.prenom, formData.arbitre.dateNaissance, router]);

  const handleBack = () => {
    router.push('/arbitre/form/new/stepB');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation des documents obligatoires pour nouvelle licence
    if (!formData.arbitre.pieceIdentite || formData.arbitre.pieceIdentite.trim() === '') {
      setError('La pièce d\'identité est obligatoire pour une nouvelle licence');
      setIsLoading(false);
      return;
    }

    if (!formData.arbitre.certificatMedical || formData.arbitre.certificatMedical.trim() === '') {
      setError('Le certificat médical est obligatoire pour une nouvelle licence');
      setIsLoading(false);
      return;
    }

    // Photo et signature sont optionnelles

    try {
      const recaptchaToken = await executeRecaptcha('inscription');

      // Formater le téléphone au format complet +225XXXXXXXXXX avant l'envoi
      const payload = {
        ...formData,
        arbitre: {
          ...formData.arbitre,
          telephone: formatTelephoneComplete(formData.arbitre.telephone),
        },
        numeroLicencePrecedent: formData.type === 'RENOUVELLEMENT' ? formData.numeroLicencePrecedent : undefined,
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
            Inscription Licence Arbitre Korfball
          </h1>
        </div>

        <StepIndicator currentStep="stepC" type="new" />

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

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents obligatoires</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pièce d'identité <span className="text-red-500">*</span>
                      </label>
                      <ImageCapture
                        value={formData.arbitre.pieceIdentite}
                        onChange={(value) => updateFormData({ arbitre: { ...formData.arbitre, pieceIdentite: value } })}
                        placeholder="Prendre une photo de votre pièce d'identité"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certificat médical <span className="text-red-500">*</span>
                      </label>
                      <ImageCapture
                        value={formData.arbitre.certificatMedical}
                        onChange={(value) => updateFormData({ arbitre: { ...formData.arbitre, certificatMedical: value } })}
                        placeholder="Prendre une photo de votre certificat médical"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents optionnels</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photo
                      </label>
                      <ImageCapture
                        value={formData.arbitre.photo}
                        onChange={(value) => updateFormData({ arbitre: { ...formData.arbitre, photo: value } })}
                        placeholder="Prendre une photo de vous"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Signature
                      </label>
                      <ImageCapture
                        value={formData.arbitre.signature}
                        onChange={(value) => updateFormData({ arbitre: { ...formData.arbitre, signature: value } })}
                        placeholder="Prendre une photo de votre signature"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Alert type="info">
                <p className="text-sm">
                  <strong>Note :</strong> Les documents marqués d'un astérisque (*) sont obligatoires pour valider votre inscription.
                  Assurez-vous que les photos sont claires et lisibles.
                </p>
              </Alert>

              <div className="flex justify-between pt-4 border-t">
                <Button onClick={handleBack} type="button" variant="secondary" disabled={isLoading}>
                  ← Retour
                </Button>
                <Button type="submit" isLoading={isLoading} disabled={!isLoaded}>
                  {isLoading ? 'Envoi en cours...' : 'Soumettre l\'inscription'}
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

