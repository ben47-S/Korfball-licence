'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/date-utils';
import { formatTelephone } from '@/lib/utils';
import { useFormData } from '../../hooks/useFormData';
import StepIndicator from '../../components/StepIndicator';
import type { Saison } from '../../types';

interface LicencePrecedente {
  id: string;
  type: string;
  statut: string;
  numeroLicence: string | null;
  arbitre: {
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string;
    dateNaissance: string;
    sexe: string | null;
    nationalite: string;
    numeroPieceIdentite: string;
    photo: string | null;
    signature: string | null;
  };
  saison: {
    id: string;
    code: string;
  };
}

export default function RenewStepAPage() {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();
  const [error, setError] = useState('');
  const [saisonEnCours, setSaisonEnCours] = useState<Saison | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [numeroLicenceInput, setNumeroLicenceInput] = useState('');
  const [dateNaissanceInput, setDateNaissanceInput] = useState('');
  const [telephoneInput, setTelephoneInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [licencePrecedente, setLicencePrecedente] = useState<LicencePrecedente | null>(null);
  const [formPreRempli, setFormPreRempli] = useState(false);

  useEffect(() => {
    let isMounted = true;

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
            if (formData.saisonId !== saison.id || formData.type !== 'RENOUVELLEMENT') {
              updateFormData({
                saisonId: saison.id,
                type: 'RENOUVELLEMENT'
              });
            }
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

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleVerifyCredentials = async () => {
    // Validation des champs
    if (!numeroLicenceInput || numeroLicenceInput.trim().length === 0) {
      setError('Veuillez entrer votre numéro de licence');
      return;
    }

    if (!dateNaissanceInput || dateNaissanceInput.trim().length === 0) {
      setError('Veuillez entrer votre date de naissance');
      return;
    }

    if (!telephoneInput || telephoneInput.trim().length === 0) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    // Valider le format du numéro de licence
    if (!/^FIK-\d{4}-\d{6}$/.test(numeroLicenceInput.toUpperCase())) {
      setError('Format de numéro de licence invalide. Format attendu: FIK-YYYY-XXXXXX');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Normaliser le téléphone (enlever les espaces)
      const telephoneNormalise = telephoneInput.replace(/\s/g, '');

      const response = await fetch(
        `/api/arbitres/inscriptions?numeroLicence=${encodeURIComponent(numeroLicenceInput.toUpperCase())}&dateNaissance=${encodeURIComponent(dateNaissanceInput)}&telephone=${encodeURIComponent(telephoneNormalise)}&forRenewal=true`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Informations invalides');
      }

      const licence: LicencePrecedente = await response.json();

      // Vérifier que la licence est validée
      if (licence.statut !== 'VALIDEE') {
        throw new Error('Votre licence précédente n\'est pas validée. Vous ne pouvez renouveler qu\'une licence validée.');
      }

      // Vérifier que ce n'est pas la même saison
      if (licence.saison.id === formData.saisonId) {
        // Vérifier s'il existe déjà une licence pour cette saison
        const checkRenewalResponse = await fetch(`/api/arbitres/inscriptions/check?arbitreId=${licence.arbitre.id}&saisonId=${formData.saisonId}`);
        if (checkRenewalResponse.ok) {
          const checkData = await checkRenewalResponse.json();
          if (checkData.exists && checkData.licence) {
            router.replace(`/arbitre/suivi?redirected=renewal`);
            return;
          }
        }
        throw new Error('Vous ne pouvez pas renouveler une licence pour la même saison.');
      }

      // Vérifier qu'il n'existe pas déjà une licence pour cette saison
      const checkRenewalResponse = await fetch(`/api/arbitres/inscriptions/check?arbitreId=${licence.arbitre.id}&saisonId=${formData.saisonId}`);
      if (checkRenewalResponse.ok) {
        const checkData = await checkRenewalResponse.json();
        if (checkData.exists && checkData.licence) {
          router.replace(`/arbitre/suivi?redirected=renewal`);
          return;
        }
      }

      // Pré-remplir le formulaire avec les données de la licence précédente
      updateFormData({
        type: formData.type,
        saisonId: formData.saisonId,
        numeroLicencePrecedent: licence.numeroLicence || '',
        arbitre: {
          nom: licence.arbitre.nom,
          prenom: licence.arbitre.prenom,
          email: licence.arbitre.email || '',
          telephone: licence.arbitre.telephone || '',
          dateNaissance: new Date(licence.arbitre.dateNaissance).toISOString().split('T')[0],
          sexe: licence.arbitre.sexe || '',
          nationalite: licence.arbitre.nationalite || 'Ivoirienne',
          numeroPieceIdentite: licence.arbitre.numeroPieceIdentite || '',
          adresse: '',
          niveauArbitre: '',
          dateCertification: '',
          numeroCertificat: '',
          autoriteCertificatrice: '',
          zoneAffectation: '',
          certificatMedicalValide: '',
          dateExpirationCertificatMedical: '',
          assuranceActive: '',
          photo: licence.arbitre.photo || '',
          signature: licence.arbitre.signature || '',
          pieceIdentite: '',
          certificatMedical: '',
        },
      });

      setLicencePrecedente(licence);
      setFormPreRempli(true);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Une erreur est survenue lors de la vérification');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNext = () => {
    if (!formData.type || !formData.saisonId) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.type !== 'RENOUVELLEMENT') {
      setError('Cette page est réservée au renouvellement de licence');
      return;
    }

    if (!formData.numeroLicencePrecedent) {
      setError('Le numéro de licence précédent est obligatoire pour un renouvellement');
      return;
    }

    setError('');
    router.push('/arbitre/form/reNew/stepB');
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
            {saisonEnCours && (
              <span className="block text-2xl text-purple-600 mt-2">
                Saison {saisonEnCours.code}
              </span>
            )}
          </h1>
          <p className="text-purple-900 text-4xl font-bold">
            Renouvellement de licence
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

        <StepIndicator currentStep="stepA" type="reNew" />

        {error && (
          <div className="mb-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {!loadingData && saisonEnCours && (
          <Card>
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Étape 1 : Vérification et informations générales
              </h2>

              {/* Type de licence fixé à RENOUVELLEMENT pour cette route */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de licence
                </label>
                <div className="text-lg font-semibold text-purple-900">
                  Renouvellement
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

              {/* Étape 1 : Vérification des informations */}
              {!formPreRempli && (
                <>
                  <div className="space-y-4">
                    <Input
                      label="Numéro de licence"
                      type="text"
                      required
                      value={numeroLicenceInput}
                      onChange={(e) => setNumeroLicenceInput(e.target.value.toUpperCase())}
                      placeholder="FIK-2024-123456"
                      helperText="Format: FIK-YYYY-XXXXXX"
                    />
                    <Input
                      label="Date de naissance"
                      type="date"
                      required
                      value={dateNaissanceInput}
                      onChange={(e) => setDateNaissanceInput(e.target.value)}
                    />
                    <Input
                      label="Numéro de téléphone"
                      type="tel"
                      prefix="+225"
                      required
                      value={telephoneInput.replace(/^\+225/, '')}
                      onChange={(e) => {
                        const formatted = formatTelephone(e.target.value);
                        setTelephoneInput(formatted);
                      }}
                      placeholder="0123456789"
                      helperText="Entrez les 10 chiffres du numéro"
                      maxLength={10}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleVerifyCredentials} type="button" isLoading={isVerifying}>
                      Vérifier mes informations
                    </Button>
                  </div>
                </>
              )}

              {/* Étape 2 : Formulaire pré-rempli après vérification */}
              {formPreRempli && licencePrecedente && (
                <>
                  <Alert type="success">
                    <strong>Informations vérifiées !</strong>
                    <br />
                    Votre formulaire a été pré-rempli avec les données de votre licence précédente (saison {licencePrecedente.saison.code}).
                    Vous pouvez modifier les informations si nécessaire.
                  </Alert>

                  <Input
                    label="Numéro de licence précédent"
                    type="text"
                    required
                    value={formData.numeroLicencePrecedent}
                    disabled
                    helperText="Numéro de licence vérifié et validé"
                  />

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleNext} type="button">
                      Suivant →
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}

