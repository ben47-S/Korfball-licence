'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Loader from '@/components/ui/Loader';
import type { Saison, Club, Licence } from './types';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { useLoading } from '@/contexts/LoadingContext';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'saisons' | 'clubs' | 'licences'>('licences');
  
  // États communs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setLoading: setGlobalLoading } = useLoading();

  // États pour les saisons
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [newSaison, setNewSaison] = useState({
    debut: '',
    fin: '',
    inscriptionDebut: '',
    inscriptionFin: '',
  });
  const [codeSaisonGenere, setCodeSaisonGenere] = useState<string>('');

  // États pour les clubs
  const [clubs, setClubs] = useState<Club[]>([]);
  const [newClub, setNewClub] = useState({
    nom: '',
    ville: '',
    pays: "Côte d'Ivoire",
  });

  // États pour les licences
  const [licences, setLicences] = useState<Licence[]>([]);
  const [filterStatut, setFilterStatut] = useState<'TOUS' | 'SOUMISE' | 'VALIDEE' | 'REJETEE'>('TOUS');
  const [filterSaison, setFilterSaison] = useState<'EN_COURS' | 'ARCHIVES' | 'TOUS' | string>('EN_COURS');
  const [selectedLicence, setSelectedLicence] = useState<Licence | null>(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [commentaireRejet, setCommentaireRejet] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCreatingSaison, setIsCreatingSaison] = useState(false);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [isMarkingPayment, setIsMarkingPayment] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const loadingRef = useRef(false);

  const loadData = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    try {
      setLoading(true);
      setGlobalLoading(true);
      setError('');

      const promises: Promise<any>[] = [];

      if (activeTab === 'saisons' || activeTab === 'licences' || activeTab === 'clubs') {
        promises.push(fetch('/api/saisons'));
      }
      if (activeTab === 'clubs' || activeTab === 'licences') {
        promises.push(fetch('/api/clubs'));
      }
      if (activeTab === 'licences') {
        // Construire les paramètres de query
        const params = new URLSearchParams();
        if (filterStatut !== 'TOUS') {
          params.append('statut', filterStatut);
        }
        if (filterSaison !== 'TOUS') {
          params.append('saisonId', filterSaison);
        }
        const queryString = params.toString();
        promises.push(
          fetch(`/api/licences${queryString ? `?${queryString}` : ''}`)
        );
      }

      const results = await Promise.all(promises);

      if (activeTab === 'saisons' && results[0]) {
        const saisonsRes = results[0];
        if (saisonsRes.ok) {
          const data = await saisonsRes.json();
          setSaisons(data.data || []);
        }
      }

      if (activeTab === 'clubs') {
        const [saisonsRes, clubsRes] = results;
        if (saisonsRes?.ok) {
          const data = await saisonsRes.json();
          setSaisons(data.data || []);
        }
        if (clubsRes?.ok) {
          const data = await clubsRes.json();
          setClubs(data.data || []);
        }
      }

      if (activeTab === 'licences') {
        const [saisonsRes, clubsRes, licencesRes] = results;
        if (saisonsRes?.ok) {
          const data = await saisonsRes.json();
          setSaisons(data.data || []);
        }
        if (clubsRes?.ok) {
          const data = await clubsRes.json();
          setClubs(data.data || []);
        }
        if (licencesRes?.ok) {
          const data = await licencesRes.json();
          setLicences(data.data || []);
        } else if (licencesRes) {
          // Gérer l'erreur de l'API licences
          const errorData = await licencesRes.json().catch(() => ({ message: 'Erreur inconnue' }));
          console.error('Erreur lors du chargement des licences:', errorData);
          setError(errorData.message || 'Erreur lors du chargement des licences');
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
      loadingRef.current = false;
    }
  }, [filterStatut, filterSaison, activeTab, setGlobalLoading]); // Ajouter filterSaison aux dépendances

  useEffect(() => {
    // Détecter si on est sur mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculer le code de la saison en temps réel à partir des dates
  useEffect(() => {
    if (newSaison.debut && newSaison.fin) {
      try {
        const debut = new Date(newSaison.debut);
        const fin = new Date(newSaison.fin);
        if (!isNaN(debut.getTime()) && !isNaN(fin.getTime())) {
          const anneeDebut = debut.getFullYear();
          const anneeFin = fin.getFullYear();
          setCodeSaisonGenere(`${anneeDebut}-${anneeFin}`);
        } else {
          setCodeSaisonGenere('');
        }
      } catch {
        setCodeSaisonGenere('');
      }
    } else {
      setCodeSaisonGenere('');
    }
  }, [newSaison.debut, newSaison.fin]);

  // Handlers pour les saisons
  const handleCreateSaison = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSaison(true);
    try {
      setError('');
      setSuccess('');

      const response = await fetch('/api/saisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSaison),
      });

      if (response.ok) {
        setSuccess('Saison créée avec succès');
        setNewSaison({
          debut: '',
          fin: '',
          inscriptionDebut: '',
          inscriptionFin: '',
        });
        loadData();
      } else {
        const data = await response.json();
        setError(data.message || 'Erreur lors de la création de la saison');
      }
    } catch (err) {
      setError('Erreur lors de la création de la saison');
    } finally {
      setIsCreatingSaison(false);
    }
  };


  // Handlers pour les clubs
  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!newClub.nom || !newClub.ville) {
      setError('Le nom et la ville du club sont obligatoires');
      return;
    }
    
    setIsCreatingClub(true);
    setError('');
    setSuccess('');
    try {
      setError('');
      setSuccess('');

      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: newClub.nom,
          ville: newClub.ville,
          pays: newClub.pays || null,
        }),
      });

      if (response.ok) {
        setSuccess('Club créé avec succès');
        setNewClub({ nom: '', ville: '', pays: "Côte d'Ivoire" });
        loadData();
      } else {
        const data = await response.json();
        setError(data.message || 'Erreur lors de la création du club');
      }
    } catch (err) {
      setError('Erreur lors de la création du club');
    } finally {
      setIsCreatingClub(false);
    }
  };

  // Handlers pour les licences
  const handleValidateLicence = async () => {
    if (!selectedLicence) {
      setError('Veuillez sélectionner une licence');
      return;
    }

    setIsValidating(true);
    try {
      setError('');
      setSuccess('');

      const response = await fetch('/api/licences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenceId: selectedLicence.id,
          action: 'validate',
          // Pas de numeroLicence : sera généré automatiquement
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Le numéro de licence est déjà assigné lors de la création pour les nouveaux joueurs
        // Pour les renouvellements, le joueur garde son numéro précédent
        const numeroLicence = data.joueur?.numeroLicence || selectedLicence.joueur.numeroLicence;
        const nomComplet = `${selectedLicence.joueur.nom} ${selectedLicence.joueur.prenom}`;
        
        // Afficher une alerte avec le nom et le numéro
        if (numeroLicence) {
          setSuccess(`Licence validée avec succès pour ${nomComplet}. Numéro de licence : ${numeroLicence}`);
        } else {
          setSuccess(`Licence validée avec succès pour ${nomComplet}`);
        }
        
        setShowValidateModal(false);
        setSelectedLicence(null);
        loadData();
      } else {
        const data = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        setError(data.message || 'Erreur lors de la validation de la licence');
      }
    } catch (err) {
      setError('Erreur lors de la validation de la licence');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRejectLicence = async () => {
    if (!selectedLicence || !commentaireRejet || commentaireRejet.length < 3) {
      setError('Veuillez saisir un commentaire de rejet (minimum 3 caractères)');
      return;
    }

    setIsRejecting(true);
    try {
      setError('');
      setSuccess('');

      const response = await fetch('/api/licences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenceId: selectedLicence.id,
          commentaireAdmin: commentaireRejet,
        }),
      });

      if (response.ok) {
        setSuccess('Licence rejetée avec succès');
        setShowRejectModal(false);
        setSelectedLicence(null);
        setCommentaireRejet('');
        loadData();
      } else {
        const data = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        setError(data.message || 'Erreur lors du rejet de la licence');
      }
    } catch (err) {
      setError('Erreur lors du rejet de la licence');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo en arrière-plan */}
      <div 
        className="fixed inset-0 opacity-20 md:opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/images/logoKorfball.jpg)',
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
        <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Administration</h1>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('licences')}
              className={`${
                activeTab === 'licences'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Licences
            </button>
            <button
              onClick={() => setActiveTab('saisons')}
              className={`${
                activeTab === 'saisons'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Saisons
            </button>
            <button
              onClick={() => setActiveTab('clubs')}
              className={`${
                activeTab === 'clubs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Clubs
            </button>
          </nav>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert type="success">{success}</Alert>
          </div>
        )}

        {/* Licences Tab */}
        {activeTab === 'licences' && (
          <div className="space-y-6">
            <Card title="Demandes de licences">
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Filtrer par statut"
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value as any)}
                  options={[
                    { value: 'TOUS', label: 'Toutes les licences' },
                    { value: 'SOUMISE', label: 'En attente (SOUMISE)' },
                    { value: 'VALIDEE', label: 'Validées' },
                    { value: 'REJETEE', label: 'Rejetées' },
                  ]}
                />

                <Select
                  label="Filtrer par saison"
                  value={filterSaison}
                  onChange={(e) => setFilterSaison(e.target.value)}
                  options={[
                    { value: 'EN_COURS', label: '📅 Saison en cours' },
                    { value: 'ARCHIVES', label: '📦 Archives (saisons passées)' },
                    { value: 'TOUS', label: 'Toutes les saisons' },
                    ...saisons.map(s => ({
                      value: s.id,
                      label: `${s.code}${s.enCours ? ' (en cours)' : ''}`,
                    })),
                  ]}
                />
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader size="lg" />
                  <p className="text-gray-600 text-sm">Chargement des licences...</p>
                </div>
              ) : licences.length === 0 ? (
                <p className="text-gray-600">Aucune licence trouvée</p>
              ) : (
                <>
                  {filterSaison === 'ARCHIVES' && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium">
                        📦 Vue Archives - Licences des saisons passées
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        {licences.length} licence{licences.length > 1 ? 's' : ''} trouvée{licences.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  <div className={`space-y-4 ${filterSaison === 'ARCHIVES' ? 'opacity-90' : ''}`}>
                  {licences.map((licence) => (
                    <div
                      key={licence.id}
                      className={`border rounded-lg bg-white ${
                        filterSaison === 'ARCHIVES'
                          ? 'border-amber-200 p-4 text-sm' // Style compact pour les archives
                          : 'border-gray-200 p-6'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {licence.joueur.prenom} {licence.joueur.nom}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {licence.type === 'NOUVEAU' ? 'Nouvelle licence' : 'Renouvellement'} -{' '}
                            Saison {licence.saison.code}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            licence.statut === 'SOUMISE'
                              ? 'bg-yellow-100 text-yellow-800'
                              : licence.statut === 'VALIDEE'
                              ? 'bg-green-100 text-green-800'
                              : licence.statut === 'REJETEE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {licence.statut}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Informations du joueur
                          </h4>
                          <dl className="space-y-1 text-sm">
                            <div className="flex">
                              <dt className="text-gray-500 w-32">Date de naissance:</dt>
                              <dd className="text-gray-900">
                                {formatDate(licence.joueur.dateNaissance)}
                              </dd>
                            </div>
                            {licence.joueur.lieuNaissance && (
                              <div className="flex">
                                <dt className="text-gray-500 w-32">Lieu de naissance:</dt>
                                <dd className="text-gray-900">{licence.joueur.lieuNaissance}</dd>
                              </div>
                            )}
                            {licence.joueur.nationalite && (
                              <div className="flex">
                                <dt className="text-gray-500 w-32">Nationalité:</dt>
                                <dd className="text-gray-900">{licence.joueur.nationalite}</dd>
                              </div>
                            )}
                            {licence.joueur.email && (
                              <div className="flex">
                                <dt className="text-gray-500 w-32">Email:</dt>
                                <dd className="text-gray-900">{licence.joueur.email}</dd>
                              </div>
                            )}
                            {licence.joueur.telephone && (
                              <div className="flex">
                                <dt className="text-gray-500 w-32">Téléphone:</dt>
                                <dd className="text-gray-900">{licence.joueur.telephone}</dd>
                              </div>
                            )}
                            {licence.joueur.numeroLicence && (
                              <div className="flex">
                                <dt className="text-gray-500 w-32">N° Licence:</dt>
                                <dd className="text-gray-900 font-semibold">
                                  {licence.joueur.numeroLicence}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        {/* Documents - Affichage en grille compacte */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Documents
                          </h4>
                          {(licence.joueur.photo || licence.joueur.signature || licence.joueur.pieceIdentite || licence.joueur.certificatMedical) ? (
                            <div className="grid grid-cols-2 gap-3">
                              {licence.joueur.photo && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Photo:</p>
                                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors">
                                    <img
                                      src={licence.joueur.photo}
                                      alt={`Photo de ${licence.joueur.prenom} ${licence.joueur.nom}`}
                                      className="w-full h-32 object-cover"
                                      onClick={() => window.open(licence.joueur.photo!, '_blank')}
                                      title="Cliquer pour agrandir"
                                    />
                                  </div>
                                </div>
                              )}
                              {licence.joueur.signature && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Signature:</p>
                                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors">
                                    <img
                                      src={licence.joueur.signature}
                                      alt={`Signature de ${licence.joueur.prenom} ${licence.joueur.nom}`}
                                      className="w-full h-32 object-cover"
                                      onClick={() => window.open(licence.joueur.signature!, '_blank')}
                                      title="Cliquer pour agrandir"
                                    />
                                  </div>
                                </div>
                              )}
                              {licence.joueur.pieceIdentite && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Pièce d'identité:</p>
                                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors">
                                    <img
                                      src={licence.joueur.pieceIdentite}
                                      alt={`Pièce d'identité de ${licence.joueur.prenom} ${licence.joueur.nom}`}
                                      className="w-full h-32 object-cover"
                                      onClick={() => window.open(licence.joueur.pieceIdentite!, '_blank')}
                                      title="Cliquer pour agrandir"
                                    />
                                  </div>
                                </div>
                              )}
                              {licence.joueur.certificatMedical && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Certificat médical:</p>
                                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors">
                                    <img
                                      src={licence.joueur.certificatMedical}
                                      alt={`Certificat médical de ${licence.joueur.prenom} ${licence.joueur.nom}`}
                                      className="w-full h-32 object-cover"
                                      onClick={() => window.open(licence.joueur.certificatMedical!, '_blank')}
                                      title="Cliquer pour agrandir"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">
                              Aucun document fourni
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Clubs</h4>
                          <dl className="space-y-1 text-sm">
                            {licence.clubActuel && (
                              <div>
                                <dt className="text-gray-500">Club actuel:</dt>
                                <dd className="text-gray-900 font-medium">
                                  {licence.clubActuel.nom}
                                  {licence.clubActuel.ville && ` - ${licence.clubActuel.ville}`}
                                </dd>
                              </div>
                            )}
                            {licence.clubPrecedent && (
                              <div>
                                <dt className="text-gray-500">Club précédent:</dt>
                                <dd className="text-gray-900">
                                  {licence.clubPrecedent.nom}
                                  {licence.clubPrecedent.ville &&
                                    ` - ${licence.clubPrecedent.ville}`}
                                </dd>
                              </div>
                            )}
                          </dl>

                          {licence.joueur.responsables.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Responsables
                              </h4>
                              <ul className="space-y-1 text-sm">
                                {licence.joueur.responsables.map((resp) => (
                                  <li key={resp.id} className="text-gray-900">
                                    {resp.prenom} {resp.nom} ({resp.lien})
                                    {resp.telephone && ` - ${resp.telephone}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {licence.commentaireAdmin && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm font-medium text-red-800">Commentaire admin:</p>
                          <p className="text-sm text-red-700">{licence.commentaireAdmin}</p>
                        </div>
                      )}

                      {licence.statut === 'SOUMISE' && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => {
                              setSelectedLicence(licence);
                              setShowValidateModal(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            ✓ Valider
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedLicence(licence);
                              setCommentaireRejet('');
                              setShowRejectModal(true);
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            ✗ Rejeter
                          </Button>
                        </div>
                      )}

                      {licence.statut === 'VALIDEE' && (
                        <div className="mt-4 space-y-2">
                          {licence.paiement?.statut === 'VALIDE' ? (
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                              <p className="text-sm font-medium text-green-800">
                                ✓ Paiement effectué
                              </p>
                              {licence.paiement.paidAt && (
                                <p className="text-xs text-green-600 mt-1">
                                  Le {formatDate(licence.paiement.paidAt)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Button
                              onClick={async () => {
                                setIsMarkingPayment(licence.id);
                                try {
                                  setError('');
                                  setSuccess('');
                                  const response = await fetch('/api/licences/paiement', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ licenceId: licence.id }),
                                  });

                                  if (response.ok) {
                                    setSuccess('Paiement enregistré avec succès');
                                    loadData();
                                  } else {
                                    const data = await response.json();
                                    setError(data.message || 'Erreur lors de l\'enregistrement du paiement');
                                  }
                                } catch (err) {
                                  setError('Erreur lors de l\'enregistrement du paiement');
                                } finally {
                                  setIsMarkingPayment(null);
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full"
                              isLoading={isMarkingPayment === licence.id}
                            >
                              💳 Paiement effectué
                            </Button>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-4">
                        Demandée le {formatDateTime(licence.createdAt)}
                      </p>
                    </div>
                  ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* Saisons Tab */}
        {activeTab === 'saisons' && (
          <div className="space-y-6">
            <Card title="Créer une nouvelle saison">
              <form onSubmit={handleCreateSaison} className="space-y-4">
                <Input
                  label="Code de la saison"
                  value={codeSaisonGenere}
                  disabled
                  placeholder="la date de début et fin de la saison correspondra au code de la saison"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date de début"
                    type="date"
                    required
                    value={newSaison.debut}
                    onChange={(e) => setNewSaison({ ...newSaison, debut: e.target.value })}
                  />

                  <Input
                    label="Date de fin"
                    type="date"
                    required
                    value={newSaison.fin}
                    onChange={(e) => setNewSaison({ ...newSaison, fin: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Début des inscriptions"
                    type="date"
                    required
                    value={newSaison.inscriptionDebut}
                    onChange={(e) =>
                      setNewSaison({ ...newSaison, inscriptionDebut: e.target.value })
                    }
                  />

                  <Input
                    label="Fin des inscriptions"
                    type="date"
                    required
                    value={newSaison.inscriptionFin}
                    onChange={(e) =>
                      setNewSaison({ ...newSaison, inscriptionFin: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" isLoading={isCreatingSaison}>
                  Créer la saison
                </Button>
              </form>
            </Card>

            <Card title="Liste des saisons">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader size="lg" />
                  <p className="text-gray-600 text-sm">Chargement des saisons...</p>
                </div>
              ) : saisons.length === 0 ? (
                <p className="text-gray-600">Aucune saison enregistrée</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Période
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inscriptions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          En cours
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {saisons.map((saison) => {
                        const inscriptionFin = new Date(saison.inscriptionFin);
                        const aujourdhui = new Date();
                        aujourdhui.setHours(0, 0, 0, 0);
                        inscriptionFin.setHours(0, 0, 0, 0);
                        const estPassee = inscriptionFin < aujourdhui;

                        return (
                          <tr key={saison.id} className={saison.enCours ? 'bg-green-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {saison.code}
                              {saison.enCours && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  En cours
                                </span>
                              )}
                            </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(saison.debut)} - {formatDate(saison.fin)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(saison.inscriptionDebut)} - {formatDate(saison.inscriptionFin)}
                          </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {saison.enCours ? (
                                <span className="text-green-600 font-medium">✓ Oui</span>
                              ) : (
                                <span className="text-gray-400">Non</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Clubs Tab */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            <Card title="Créer un nouveau club">
              <form onSubmit={handleCreateClub} className="space-y-4">
                <Input
                  label="Nom du club"
                  required
                  value={newClub.nom}
                  onChange={(e) => setNewClub({ ...newClub, nom: e.target.value })}
                  placeholder="ex: ASEC Mimosas"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ville"
                    required
                    value={newClub.ville}
                    onChange={(e) => setNewClub({ ...newClub, ville: e.target.value })}
                    placeholder="ex: Abidjan"
                  />

                  <Input
                    label="Pays"
                    value={newClub.pays}
                    disabled
                    placeholder="Côte d'Ivoire"
                  />
                </div>

                <Button type="submit" isLoading={isCreatingClub}>
                  Créer le club
                </Button>
              </form>
            </Card>

            <Card title="Liste des clubs">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader size="lg" />
                  <p className="text-gray-600 text-sm">Chargement des clubs...</p>
                </div>
              ) : clubs.length === 0 ? (
                <p className="text-gray-600">Aucun club enregistré</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ville
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pays
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Saison en cours
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clubs.map((club) => {
                        const saisonEnCours = saisons.find(s => s.enCours === true);
                        return (
                          <tr key={club.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {club.nom}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {club.ville || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {club.pays || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {saisonEnCours ? (
                                <span className="text-green-600 font-medium">✓ Oui</span>
                              ) : (
                                <span className="text-gray-400">Non</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
        </div>
      </div>

      {/* Modal de validation */}
      {showValidateModal && selectedLicence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowValidateModal(false);
                setSelectedLicence(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">Valider la licence</h2>
            <p className="text-gray-600 mb-4">
              Valider la licence de {selectedLicence.joueur.nom}{' '}
              {selectedLicence.joueur.prenom}?
            </p>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleValidateLicence}
                variant="outline"
                className="flex-1"
                isLoading={isValidating}
              >
                Valider
              </Button>
              <Button
                onClick={() => {
                  setShowValidateModal(false);
                  setSelectedLicence(null);
                }}
                variant="secondary"
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rejet */}
      {showRejectModal && selectedLicence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setSelectedLicence(null);
                setCommentaireRejet('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">Rejeter la licence</h2>
            <p className="text-gray-600 mb-4">
              Rejeter la licence de {selectedLicence.joueur.prenom}{' '}
              {selectedLicence.joueur.nom} ?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (obligatoire)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                value={commentaireRejet}
                onChange={(e) => setCommentaireRejet(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                required
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleRejectLicence}
                variant="secondary"
                className="flex-1"
                isLoading={isRejecting}
              >
                Rejeter
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedLicence(null);
                  setCommentaireRejet('');
                }}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
