'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import ImageCapture from '@/components/ui/ImageCapture';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { useFormData } from '../../../hooks/useFormData';
import StepIndicator from '../../../components/StepIndicator';
import type { ResponsableFormData } from '../../../types';
import { formatTelephone, validateTelephone, formatTelephoneComplete } from '@/lib/utils';

export default function RenewStepCPage() {
  const router = useRouter();
  const { isLoaded, executeRecaptcha } = useRecaptcha();
  const { formData, updateFormData, clearFormData, isHydrated } = useFormData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [licenceId, setLicenceId] = useState('');
  const [responsableTemp, setResponsableTemp] = useState<ResponsableFormData>({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    lien: '',
  });

  // Calculer l'âge du joueur
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(formData.joueur.dateNaissance);
  const isMineur = age > 0 && age < 18;

  // Charger le commentaire admin et l'ID de licence depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const comment = localStorage.getItem('admin_rejection_comment') || '';
      const id = localStorage.getItem('editing_licence_id') || '';
      setAdminComment(comment);
      setLicenceId(id);

      // Vérifier qu'on a bien les données nécessaires
      if (!id) {
        router.push('/inscription/suivi');
      }
    }
  }, [router]);

  // Diagnostic : vérifier que les photos sont chargées
  useEffect(() => {
    if (isHydrated && formData.joueur) {
      console.log('📸 Photos dans le formulaire stepC:', {
        photo: formData.joueur.photo ? '✅ Présente (' + formData.joueur.photo.substring(0, 50) + '...)' : '❌ Manquante',
        signature: formData.joueur.signature ? '✅ Présente (' + formData.joueur.signature.substring(0, 50) + '...)' : '❌ Manquante',
        pieceIdentite: formData.joueur.pieceIdentite ? '✅ Présente (' + formData.joueur.pieceIdentite.substring(0, 50) + '...)' : '❌ Manquante',
        certificatMedical: formData.joueur.certificatMedical ? '✅ Présente (' + formData.joueur.certificatMedical.substring(0, 50) + '...)' : '❌ Manquante',
      });
    }
  }, [isHydrated, formData.joueur]);

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
  // Attendre que les données soient chargées depuis localStorage avant de vérifier
  useEffect(() => {
    // Ne pas rediriger pendant le chargement ou la soumission
    if (!isHydrated || isLoading) return;

    if (!formData.type || !formData.saisonId) {
      router.replace('/inscription/form/edit/renouvellement/stepA');
      return;
    }
    if (formData.type !== 'RENOUVELLEMENT') {
      router.replace('/inscription/form/edit/renouvellement/stepA');
      return;
    }
    if (!formData.joueur.nom || !formData.joueur.prenom || !formData.joueur.dateNaissance || !formData.joueur.sexe) {
      router.replace('/inscription/form/edit/renouvellement/stepB');
      return;
    }
  }, [isHydrated, isLoading, formData.type, formData.saisonId, formData.joueur.nom, formData.joueur.prenom, formData.joueur.dateNaissance, formData.joueur.sexe, router]);

  const handleResponsableChange = (field: keyof ResponsableFormData, value: string) => {
    setResponsableTemp({
      ...responsableTemp,
      [field]: value,
    });
  };

  const ajouterResponsable = () => {
    // Validation des champs obligatoires
    if (!responsableTemp.nom || !responsableTemp.prenom || !responsableTemp.telephone || !responsableTemp.lien) {
      setError('Veuillez remplir tous les champs obligatoires (Nom, Prénom, Téléphone et Lien) pour ajouter un responsable.');
      return;
    }

    // Valider le format du téléphone (10 chiffres)
    const phoneDigits = responsableTemp.telephone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Le téléphone doit contenir exactement 10 chiffres');
      return;
    }

    if (formData.responsables.length >= 3) {
      setError('Vous ne pouvez ajouter que 3 responsables maximum.');
      return;
    }

    // Réinitialiser l'erreur si tout est valide
    setError('');

    updateFormData({
      responsables: [...formData.responsables, responsableTemp],
    });
    setResponsableTemp({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      lien: '',
    });
  };

  const retirerResponsable = (index: number) => {
    updateFormData({
      responsables: formData.responsables.filter((_, i) => i !== index),
    });
  };

  const handleBack = () => {
    router.push('/inscription/form/edit/renouvellement/stepB');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const licenceId = localStorage.getItem('editing_licence_id');
    if (!licenceId) {
      setError('Erreur : ID de licence manquant');
      setIsLoading(false);
      return;
    }

    // Validation des responsables légaux pour les mineurs
    if (isMineur && formData.responsables.length === 0) {
      setError('⚠️ Attention : Pour un joueur mineur, vous devez obligatoirement ajouter au moins un responsable légal (père, mère ou tuteur) avant de valider l\'inscription. Veuillez remplir les informations du responsable et cliquer sur "Ajouter ce responsable".');
      setIsLoading(false);
      return;
    }

    // Photo et signature sont maintenant optionnelles

    try {
      const recaptchaToken = await executeRecaptcha('inscription');

      // Formater les téléphones au format complet +225XXXXXXXXXX avant l'envoi
      const payload = {
        licenceId,
        ...formData,
        joueur: {
          ...formData.joueur,
          telephone: formatTelephoneComplete(formData.joueur.telephone),
        },
        responsables: formData.responsables.length > 0
          ? formData.responsables.map(resp => ({
              ...resp,
              telephone: formatTelephoneComplete(resp.telephone),
            }))
          : undefined,
        numeroLicencePrecedent: formData.numeroLicencePrecedent,
        clubPrecedentId: formData.clubPrecedentId || undefined,
        clubActuelId: formData.clubActuelId || undefined,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (recaptchaToken) {
        headers['x-recaptcha-token'] = recaptchaToken;
      }

      const response = await fetch('/api/inscriptions/update', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      // Nettoyer les données et rediriger vers la page de succès
      clearFormData();
      localStorage.removeItem('editing_licence_id');
      localStorage.removeItem('admin_rejection_comment');
      localStorage.removeItem('editing_numero_licence');

      router.push(`/inscription/succes?numeroLicence=${data.numeroLicence}&modified=true`);
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
          backgroundSize: isMobile ? '120%' : '70%',
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
            Modifier mon renouvellement - Étape 3
          </h1>
        </div>

        {adminComment && (
          <div className="mb-6">
            <Alert type="warning" title="Votre demande a été rejetée">
              <div>
                <p className="font-medium mb-2">Raison du rejet :</p>
                <p className="text-sm bg-white bg-opacity-50 p-3 rounded border border-yellow-300">
                  {adminComment}
                </p>
                <p className="mt-2 text-sm">
                  Veuillez corriger les informations ci-dessous et resoumettre votre demande.
                </p>
              </div>
            </Alert>
          </div>
        )}

        <StepIndicator currentStep="stepC" />

        {error && (
          <div className="mb-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Étape 3 : Responsables légaux
                {isMineur && <span className="text-red-500 ml-2">*</span>}
              </h2>

              {formData.responsables.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Responsables ajoutés :</h3>
                  {formData.responsables.map((resp, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {resp.prenom} {resp.nom} ({resp.lien})
                        </p>
                        {resp.telephone && (
                          <p className="text-sm text-gray-600">{resp.telephone}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => retirerResponsable(index)}
                        type="button"
                        variant="danger"
                        size="sm"
                      >
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {formData.responsables.length < 3 && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Ajouter un responsable
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nom"
                        value={responsableTemp.nom}
                        onChange={(e) => handleResponsableChange('nom', e.target.value)}
                      />

                      <Input
                        label="Prénom"
                        value={responsableTemp.prenom}
                        onChange={(e) => handleResponsableChange('prenom', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Input
                        label="Téléphone"
                        type="tel"
                        required
                        prefix="+225"
                        value={responsableTemp.telephone.replace(/^\+225/, '')}
                        onChange={(e) => {
                          const formatted = formatTelephone(e.target.value);
                          handleResponsableChange('telephone', formatted);
                        }}
                        placeholder="0123456789"
                        helperText="Entrez les 10 chiffres du numéro"
                        maxLength={10}
                      />

                      <Input
                        label="Email"
                        type="email"
                        value={responsableTemp.email}
                        onChange={(e) => handleResponsableChange('email', e.target.value)}
                      />
                    </div>

                    <Select
                      label="Lien"
                      className="mt-4"
                      value={responsableTemp.lien}
                      onChange={(e) => handleResponsableChange('lien', e.target.value)}
                      options={[
                        { value: 'PERE', label: 'Père' },
                        { value: 'MERE', label: 'Mère' },
                        { value: 'TUTEUR', label: 'Tuteur légal' },
                      ]}
                    />

                    <Button
                      onClick={ajouterResponsable}
                      type="button"
                      variant="outline"
                      className="mt-4"
                      disabled={!responsableTemp.nom || !responsableTemp.prenom || !responsableTemp.telephone || !responsableTemp.lien}
                    >
                      Ajouter ce responsable
                    </Button>
                  </div>
                </>
              )}

              {isMineur && formData.responsables.length === 0 && (
                <Alert type="warning">
                  <div className="space-y-1">
                    <p className="font-semibold">⚠️ Responsable légal requis</p>
                    <p>Le joueur étant mineur, vous devez obligatoirement ajouter au moins un responsable légal (père, mère ou tuteur) avant de pouvoir valider l'inscription.</p>
                    <p className="text-sm mt-2">Remplissez les champs ci-dessous et cliquez sur "Ajouter ce responsable" pour continuer.</p>
                  </div>
                </Alert>
              )}

              {/* Photo d'identité et signature */}
              <div className="border-t pt-6 mt-6 space-y-6">
                <h3 className="font-medium text-gray-900 text-lg">
                  Documents
                </h3>

                <ImageCapture
                  label="Photo d'identité du joueur (optionnel)"
                  value={formData.joueur.photo}
                  onChange={(base64) => {
                    updateFormData({
                      joueur: { ...formData.joueur, photo: base64 },
                    });
                  }}
                  description="Prenez une photo claire du visage du joueur. Vous pouvez choisir depuis la galerie ou prendre une photo directement."
                />

                <ImageCapture
                  label="Signature du joueur (optionnel)"
                  value={formData.joueur.signature}
                  onChange={(base64) => {
                    updateFormData({
                      joueur: { ...formData.joueur, signature: base64 },
                    });
                  }}
                  description="Le joueur doit signer sur une feuille de papier, puis prendre une photo de cette signature avec son téléphone."
                />

                <ImageCapture
                  label="Pièce d'identité"
                  required={true}
                  value={formData.joueur.pieceIdentite}
                  onChange={(base64) => {
                    updateFormData({
                      joueur: { ...formData.joueur, pieceIdentite: base64 },
                    });
                  }}
                  description="Uploadez une copie claire de votre pièce d'identité (passeport, carte d'identité nationale, permis de conduire, etc.)"
                  maxSizeMB={10}
                />

                <ImageCapture
                  label="Certificat médical de non contre-indication"
                  required={true}
                  value={formData.joueur.certificatMedical}
                  onChange={(base64) => {
                    updateFormData({
                      joueur: { ...formData.joueur, certificatMedical: base64 },
                    });
                  }}
                  description="Uploadez votre certificat médical attestant l'absence de contre-indication à la pratique du korfball"
                  maxSizeMB={10}
                />
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button onClick={handleBack} type="button" variant="secondary">
                  ← Retour
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Valider le renouvellement
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Badge reCAPTCHA */}
        {isLoaded && (
          <p className="text-center text-xs text-gray-500 mt-4">
            Ce site est protégé par reCAPTCHA et la{' '}
            <a
              href="https://policies.google.com/privacy"
              className="text-indigo-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Politique de confidentialité
            </a>{' '}
            et les{' '}
            <a
              href="https://policies.google.com/terms"
              className="text-indigo-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conditions d'utilisation
            </a>{' '}
            de Google s'appliquent.
          </p>
        )}
        </div>
      </div>
    </div>
  );
}
