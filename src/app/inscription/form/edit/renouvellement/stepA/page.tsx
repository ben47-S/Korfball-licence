'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/date-utils';
import { formatTelephone } from '@/lib/utils';
import { useFormData } from '../../../hooks/useFormData';
import StepIndicator from '../../../components/StepIndicator';
import type { Saison, Club } from '../../../types';

interface LicencePrecedente {
  id: string;
  type: string;
  statut: string;
  numeroLicence: string | null;
  joueur: {
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string;
    dateNaissance: string;
    lieuNaissance: string;
    nationalite: string;
    sexe: string | null;
    photo: string | null;
    signature: string | null;
  };
  saison: {
    id: string;
    code: string;
  };
  clubActuel: {
    id: string;
    nom: string;
    ville: string | null;
  } | null;
  clubPrecedent: {
    id: string;
    nom: string;
    ville: string | null;
  } | null;
  responsables: Array<{
    id: string;
    nom: string;
    prenom: string;
    telephone: string | null;
    email: string | null;
    lien: string;
  }>;
}

export default function RenewStepAPage() {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();
  const [error, setError] = useState('');
  const [saisonEnCours, setSaisonEnCours] = useState<Saison | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [aUnClubPrecedent, setAUnClubPrecedent] = useState<boolean | null>(null);
  const [numeroLicenceInput, setNumeroLicenceInput] = useState('');
  const [dateNaissanceInput, setDateNaissanceInput] = useState('');
  const [telephoneInput, setTelephoneInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [licencePrecedente, setLicencePrecedente] = useState<LicencePrecedente | null>(null);
  const [formPreRempli, setFormPreRempli] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [licenceId, setLicenceId] = useState('');
  const [numeroLicence, setNumeroLicence] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

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
            // Ne mettre à jour que si le saisonId est différent pour éviter les boucles
            // Définir aussi le type à RENOUVELLEMENT pour cette route
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

        const clubsResponse = await fetch('/api/clubs');
        if (clubsResponse.ok && isMounted) {
          const clubsData = await clubsResponse.json();
          setClubs(clubsData.data || []);
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

  // Charger le commentaire admin, l'ID de licence et le numéro de licence depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const comment = localStorage.getItem('admin_rejection_comment') || '';
      const id = localStorage.getItem('editing_licence_id') || '';
      const numero = localStorage.getItem('editing_numero_licence') || '';
      setAdminComment(comment);
      setLicenceId(id);
      setNumeroLicence(numero);

      // Si on a un licenceId, on est en mode édition
      if (id) {
        setIsEditMode(true);
        // Marquer le formulaire comme déjà pré-rempli pour skip la vérification
        setFormPreRempli(true);
      }

      // Vérifier qu'on a bien les données nécessaires
      if (!id) {
        router.push('/inscription/suivi');
      }
    }
  }, [router]);

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
    // EN MODE ÉDITION : Skip la vérification car la licence précédente a déjà été validée
    if (isEditMode) {
      setError('');
      return; // Ne rien faire, le formulaire est déjà pré-rempli
    }

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

      // Ajouter forRenewal=true pour chercher dans toutes les saisons (pas seulement la saison en cours)
      const response = await fetch(
        `/api/inscriptions?numeroLicence=${encodeURIComponent(numeroLicenceInput.toUpperCase())}&dateNaissance=${encodeURIComponent(dateNaissanceInput)}&telephone=${encodeURIComponent(telephoneNormalise)}&forRenewal=true`
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
      // Si c'est la même saison, vérifier d'abord s'il existe déjà une licence pour cette saison
      if (licence.saison.id === formData.saisonId) {
        // Vérifier s'il existe déjà une licence pour cette saison
        const checkRenewalResponse = await fetch(`/api/inscriptions/check?joueurId=${licence.joueur.id}&saisonId=${formData.saisonId}`);
        if (checkRenewalResponse.ok) {
          const checkData = await checkRenewalResponse.json();
          if (checkData.exists && checkData.licence) {
            // Rediriger vers la page de suivi - l'utilisateur devra entrer ses informations
            router.replace(`/inscription/suivi?redirected=renewal`);
            return;
          }
        }
        // Si c'est la même saison et qu'aucune licence n'existe, c'est une erreur
        throw new Error('Vous ne pouvez pas renouveler une licence pour la même saison.');
      }

      // Vérifier qu'il n'existe pas déjà une licence pour cette saison
      // Cela permet de rediriger vers la page de suivi si une licence existe déjà
      const checkRenewalResponse = await fetch(`/api/inscriptions/check?joueurId=${licence.joueur.id}&saisonId=${formData.saisonId}`);
      if (checkRenewalResponse.ok) {
        const checkData = await checkRenewalResponse.json();
        if (checkData.exists && checkData.licence) {
          // Rediriger vers la page de suivi
          router.replace(`/inscription/suivi?redirected=renewal`);
          return;
        }
      }

      // Pré-remplir le formulaire avec les données de la licence précédente
      // IMPORTANT: Préserver type et saisonId existants pour éviter les redirections
      updateFormData({
        type: formData.type, // Préserver le type RENOUVELLEMENT
        saisonId: formData.saisonId, // Préserver la saison en cours
        numeroLicencePrecedent: licence.numeroLicence || '',
        joueur: {
          nom: licence.joueur.nom,
          prenom: licence.joueur.prenom,
          email: licence.joueur.email || '',
          telephone: licence.joueur.telephone || '',
          dateNaissance: new Date(licence.joueur.dateNaissance).toISOString().split('T')[0],
          lieuNaissance: licence.joueur.lieuNaissance || '',
          nationalite: licence.joueur.nationalite || 'Ivoirienne',
          sexe: licence.joueur.sexe || '',
          photo: licence.joueur.photo || '',
          signature: licence.joueur.signature || '',
        },
        responsables: (licence.joueur.responsables || []).map((resp) => ({
          nom: resp.nom,
          prenom: resp.prenom,
          telephone: resp.telephone || '',
          email: resp.email || '',
          lien: resp.lien,
        })),
        clubPrecedentId: licence.clubPrecedent?.id || '',
        clubActuelId: licence.clubActuel?.id || '',
      });

      if (licence.clubPrecedent) {
        setAUnClubPrecedent(true);
      }

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

    // Vérifier que le club actuel est sélectionné
    if (!formData.clubActuelId || formData.clubActuelId === '') {
      setError('Veuillez sélectionner votre club actuel');
      return;
    }

    setError('');
    router.push('/inscription/form/edit/renouvellement/stepB');
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
            Modifier mon renouvellement - Étape 1
            {saisonEnCours && (
              <span className="block text-2xl text-indigo-600 mt-2">
                Saison {saisonEnCours.code}
              </span>
            )}
          </h1>
          <p className="text-blue-900 text-4xl font-bold">
            Renouvellement de licence
          </p>
        </div>

        {numeroLicence && (
          <div className="mb-6">
            <Alert type="info" title="Modification en cours">
              <div>
                <p className="font-medium">
                  Vous modifiez votre demande de renouvellement avec le matricule :
                </p>
                <p className="text-lg font-bold text-indigo-700 mt-2">
                  {numeroLicence}
                </p>
                <p className="text-sm mt-2">
                  Toutes les modifications seront appliquées à cette licence.
                </p>
              </div>
            </Alert>
          </div>
        )}

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

        {!loadingData && !saisonEnCours && (
          <div className="mb-6">
            <Alert type="warning">
              <strong>Aucune saison en cours disponible</strong>
              <br />
              Les inscriptions ne sont pas ouvertes pour le moment. Veuillez contacter votre club ou un administrateur.
            </Alert>
          </div>
        )}

        <StepIndicator currentStep="stepA" />

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
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de licence
                </label>
                <div className="text-lg font-semibold text-indigo-900">
                  Renouvellement
                </div>
              </div>

              {saisonEnCours && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saison
                  </label>
                  <div className="text-lg font-semibold text-indigo-900">
                    {saisonEnCours.code}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Période d'inscription : du {formatDate(saisonEnCours.inscriptionDebut)} au{' '}
                    {formatDate(saisonEnCours.inscriptionFin)}
                  </p>
                </div>
              )}

              {/* Étape 1 : Vérification des informations - UNIQUEMENT si pas en mode édition */}
              {!isEditMode && !formPreRempli && (
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

              {/* Étape 2 : Formulaire pré-rempli après vérification OU en mode édition */}
              {((formPreRempli && licencePrecedente) || (isEditMode && formPreRempli)) && (
                <>
                  {!isEditMode && licencePrecedente && (
                    <Alert type="success">
                      <strong>Informations vérifiées !</strong>
                      <br />
                      Votre formulaire a été pré-rempli avec les données de votre licence précédente (saison {licencePrecedente.saison.code}).
                      Vous pouvez modifier les informations si nécessaire.
                    </Alert>
                  )}

                  {/* Afficher le numéro de licence précédent (vérifié ou pré-rempli) */}
                  {formData.numeroLicencePrecedent && (
                    <Input
                      label="Numéro de licence précédent"
                      type="text"
                      required
                      value={formData.numeroLicencePrecedent}
                      disabled
                      helperText={isEditMode ? "Numéro de licence utilisé pour ce renouvellement" : "Numéro de licence vérifié et validé"}
                    />
                  )}

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Avez-vous un club précédent ?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="aUnClubPrecedentRenouvellement"
                          value="oui"
                          checked={aUnClubPrecedent === true}
                          onChange={() => {
                            setAUnClubPrecedent(true);
                            // En mode édition, garder la valeur pré-remplie, sinon utiliser licencePrecedente
                            if (!isEditMode && licencePrecedente) {
                              updateFormData({ clubPrecedentId: licencePrecedente.clubPrecedent?.id || '' });
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                          aUnClubPrecedent === true
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300 bg-white group-hover:border-indigo-400'
                        }`}>
                          {aUnClubPrecedent === true && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className={`ml-2 text-sm ${
                          aUnClubPrecedent === true ? 'text-gray-900 font-medium' : 'text-gray-700'
                        }`}>
                          Oui
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="aUnClubPrecedentRenouvellement"
                          value="non"
                          checked={aUnClubPrecedent === false}
                          onChange={() => {
                            setAUnClubPrecedent(false);
                            updateFormData({ clubPrecedentId: '' });
                          }}
                          className="sr-only"
                        />
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                          aUnClubPrecedent === false
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300 bg-white group-hover:border-indigo-400'
                        }`}>
                          {aUnClubPrecedent === false && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className={`ml-2 text-sm ${
                          aUnClubPrecedent === false ? 'text-gray-900 font-medium' : 'text-gray-700'
                        }`}>
                          Non
                        </span>
                      </label>
                    </div>
                  </div>

                  {aUnClubPrecedent === true && (
                    <Select
                      label="Club précédent"
                      value={formData.clubPrecedentId}
                      onChange={(e) => updateFormData({ clubPrecedentId: e.target.value })}
                      options={[
                        { value: '', label: 'Sélectionnez un club' },
                        ...clubs.map((club) => ({
                          value: club.id,
                          label: `${club.nom}${club.ville ? ` - ${club.ville}` : ''}${club.pays ? ` (${club.pays})` : ''}`,
                        }))
                      ]}
                      helperText="Sélectionnez votre club précédent (optionnel)"
                    />
                  )}

                  <Select
                    label="Club actuel"
                    required
                    value={formData.clubActuelId}
                    onChange={(e) => updateFormData({ clubActuelId: e.target.value })}
                    options={[
                      { value: '', label: 'Sélectionnez un club' },
                      ...clubs.map((club) => ({
                        value: club.id,
                        label: `${club.nom}${club.ville ? ` - ${club.ville}` : ''}${club.pays ? ` (${club.pays})` : ''}`,
                      }))
                    ]}
                    helperText="Sélectionnez votre club actuel"
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
