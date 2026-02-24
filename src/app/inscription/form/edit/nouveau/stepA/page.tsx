'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/date-utils';
import { useFormData } from '../../../hooks/useFormData';
import StepIndicator from '../../../components/StepIndicator';
import type { Saison, Club } from '../../../types';

export default function StepAPage() {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();
  const [error, setError] = useState('');
  const [saisonEnCours, setSaisonEnCours] = useState<Saison | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [aUnClubPrecedent, setAUnClubPrecedent] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [licenceId, setLicenceId] = useState('');
  const [numeroLicence, setNumeroLicence] = useState('');

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

      // Vérifier qu'on a bien les données nécessaires
      if (!id) {
        router.push('/inscription/suivi');
      }
    }
  }, [router]);

  // Réinitialiser l'état du club précédent et s'assurer que le type est NOUVEAU
  useEffect(() => {
    setAUnClubPrecedent(null);
    if (formData.type !== 'NOUVEAU') {
      updateFormData({ type: 'NOUVEAU', clubPrecedentId: '', clubActuelId: '' });
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
  }, []); // Charger une seule fois au montage

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
      setError('Cette page est réservée aux nouveaux joueurs');
      return;
    }

    // Vérifier que l'utilisateur a répondu à la question "Avez-vous un ancien club ?"
    if (aUnClubPrecedent === null) {
      setError('Veuillez indiquer si vous avez un ancien club');
      return;
    }

    // Vérifier que le club actuel est sélectionné
    if (!formData.clubActuelId || formData.clubActuelId === '') {
      setError('Veuillez sélectionner votre club actuel');
      return;
    }

    // Si l'utilisateur a un ancien club, vérifier qu'il l'a sélectionné
    if (aUnClubPrecedent === true && (!formData.clubPrecedentId || formData.clubPrecedentId === '')) {
      setError('Veuillez sélectionner votre ancien club');
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
    // Utiliser un petit délai pour s'assurer que localStorage est synchronisé
    setTimeout(() => {
      router.replace('/inscription/form/edit/nouveau/stepB');
    }, 100);
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
            Modifier ma demande - Étape 1
            {saisonEnCours && (
              <span className="block text-2xl text-indigo-600 mt-2">
                Saison {saisonEnCours.code}
              </span>
            )}
          </h1>
          <p className="text-blue-900 text-4xl font-bold">
            Nouveau Joueur
          </p>
        </div>

        {numeroLicence && (
          <div className="mb-6">
            <Alert type="info" title="Modification en cours">
              <div>
                <p className="font-medium">
                  Vous modifiez votre demande de licence avec le matricule :
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
                Étape 1 : Informations générales
              </h2>

              {/* Type de licence fixé à NOUVEAU pour cette route */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de licence
                </label>
                <div className="text-lg font-semibold text-indigo-900">
                  Nouvelle licence
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

              {/* Pour nouveau joueur, on affiche seulement la question sur l'ancien club */}
              {formData.type === 'NOUVEAU' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Avez-vous un ancien club ?
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="aUnClubPrecedentNouveau"
                        value="oui"
                        checked={aUnClubPrecedent === true}
                        onChange={() => {
                          setAUnClubPrecedent(true);
                          updateFormData({ clubPrecedentId: '' });
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
                        name="aUnClubPrecedentNouveau"
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
              )}

              {formData.type === 'NOUVEAU' && aUnClubPrecedent === true && (
                <Select
                  label="Ancien club"
                  value={formData.clubPrecedentId}
                  onChange={(e) => updateFormData({ clubPrecedentId: e.target.value })}
                  options={[
                    { value: '', label: 'Sélectionnez un club' },
                    ...clubs.map((club) => ({
                      value: club.id,
                      label: `${club.nom}${club.ville ? ` - ${club.ville}` : ''}${club.pays ? ` (${club.pays})` : ''}`,
                    }))
                  ]}
                  helperText="Sélectionnez votre ancien club (optionnel)"
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
            </div>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
