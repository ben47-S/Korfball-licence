'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toast from '@/components/ui/Toast';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { formatTelephone } from '@/lib/utils';

interface Paiement {
  id: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'ECHOUE';
  paidAt: string | null;
  montant: number;
  devise: string;
}

interface Licence {
  id: string;
  type: string;
  statut: 'BROUILLON' | 'SOUMISE' | 'EN_CORRECTION' | 'VALIDEE' | 'REJETEE';
  numeroLicence: string | null;
  dateValidation: string | null;
  commentaireAdmin: string | null;
  createdAt: string;
  arbitre: {
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string;
    dateNaissance: string;
    nationalite: string;
    sexe: string;
    numeroLicence: string | null;
    photo: string | null;
    signature: string | null;
    pieceIdentite: string | null;
    certificatMedical: string | null;
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
  } | null;
  paiement: Paiement | null;
}

function SuiviArbitreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [numeroLicence, setNumeroLicence] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [telephone, setTelephone] = useState('');
  const [licence, setLicence] = useState<Licence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const isRedirectedFromRenewal = searchParams.get('redirected') === 'renewal';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSearch = async () => {
    // Normaliser le numéro de licence (enlever les espaces en trop)
    const numeroLicenceNormalise = numeroLicence.trim().toUpperCase();

    // Validation des champs
    if (!numeroLicenceNormalise || numeroLicenceNormalise.length === 0) {
      setError('Veuillez entrer votre numéro de licence');
      return;
    }

    if (!dateNaissance || dateNaissance.trim().length === 0) {
      setError('Veuillez entrer votre date de naissance');
      return;
    }

    if (!telephone || telephone.trim().length === 0) {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    // Valider le format du numéro de licence (6 chiffres à la fin)
    if (!/^FIK-\d{4}-\d{6}$/.test(numeroLicenceNormalise)) {
      setError('Format de numéro de licence invalide. Format attendu: FIK-YYYY-XXXXXX (ex: FIK-2024-123456)');
      return;
    }

    setIsLoading(true);
    setError('');
    setLicence(null);

    try {
      // Normaliser le téléphone (enlever les espaces)
      const telephoneNormalise = telephone.replace(/\s/g, '');

      const response = await fetch(
        `/api/arbitres/inscriptions?numeroLicence=${encodeURIComponent(numeroLicenceNormalise)}&dateNaissance=${encodeURIComponent(dateNaissance)}&telephone=${encodeURIComponent(telephoneNormalise)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Licence introuvable');
      }

      const data = await response.json();
      // Mapper joueur -> arbitre
      const licenceArbitre = {
        ...data,
        arbitre: data.joueur || data.arbitre,
      };
      setLicence(licenceArbitre);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const badges = {
      BROUILLON: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Brouillon' },
      SOUMISE: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En cours de traitement' },
      EN_CORRECTION: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'En correction' },
      VALIDEE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Validée' },
      REJETEE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejetée' },
    };

    const config = badges[statut as keyof typeof badges] || badges.SOUMISE;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        <div className="max-w-3xl mx-auto">
        {/* Alerte de redirection depuis le renouvellement */}
        {isRedirectedFromRenewal && (
          <div className="mb-6">
            <Alert type="info">
              <strong>Suivi de votre licence</strong>
              <br />
              Vous avez été redirigé ici car vous avez déjà une licence pour la saison en cours.
              Un seul renouvellement est autorisé par saison. Vous pouvez consulter l'état de votre licence ci-dessous.
            </Alert>
          </div>
        )}

        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Suivi de licence arbitre
          </h1>
          <p className="text-gray-600">
            Entrez vos informations pour consulter l'état de votre licence
          </p>
        </div>

        {/* Formulaire de recherche */}
        <Card className="mb-6">
          <div className="space-y-4">
            <Input
              label="Numéro de licence"
              placeholder="FIK-2024-123456"
              value={numeroLicence}
              onChange={(e) => setNumeroLicence(e.target.value.toUpperCase())}
              helperText="Format: FIK-YYYY-XXXXXX"
              required
            />
            <Input
              label="Date de naissance"
              type="date"
              value={dateNaissance}
              onChange={(e) => setDateNaissance(e.target.value)}
              required
            />
            <Input
              label="Numéro de téléphone"
              type="tel"
              prefix="+225"
              value={telephone.replace(/^\+225/, '')}
              onChange={(e) => {
                const formatted = formatTelephone(e.target.value);
                setTelephone(formatted);
              }}
              placeholder="0123456789"
              helperText="Entrez les 10 chiffres du numéro"
              maxLength={10}
              required
            />
            <Button
              onClick={handleSearch}
              isLoading={isLoading}
              className="w-full"
            >
              Rechercher ma licence
            </Button>
          </div>
        </Card>

        {/* Erreur */}
        {error && (
          <div className="mb-6">
            <Alert type="error">
              {error}
            </Alert>
          </div>
        )}

        {/* Résultats */}
        {licence && (
          <Card>
            <div className="space-y-6">
              {/* Statut */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Statut de la demande</h2>
                {getStatutBadge(licence.statut)}
              </div>

              {/* Informations de l'arbitre */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations de l'arbitre</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nom</dt>
                    <dd className="mt-1 text-sm text-gray-900">{licence.arbitre.prenom} {licence.arbitre.nom}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(licence.arbitre.dateNaissance)}
                    </dd>
                  </div>
                  {licence.arbitre.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{licence.arbitre.email}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type de licence</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {licence.type === 'NOUVEAU' ? 'Nouvelle licence' : 'Renouvellement'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Documents de l'arbitre - Affichage en grille compacte */}
              {(licence.arbitre.photo || licence.arbitre.signature || licence.arbitre.pieceIdentite || licence.arbitre.certificatMedical) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {licence.arbitre.photo && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Photo</p>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors">
                          <img
                            src={licence.arbitre.photo}
                            alt={`Photo de ${licence.arbitre.prenom} ${licence.arbitre.nom}`}
                            className="w-full h-32 object-contain"
                            onClick={() => window.open(licence.arbitre.photo!, '_blank')}
                            title="Cliquer pour agrandir"
                          />
                        </div>
                      </div>
                    )}
                    {licence.arbitre.signature && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Signature</p>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors">
                          <img
                            src={licence.arbitre.signature}
                            alt={`Signature de ${licence.arbitre.prenom} ${licence.arbitre.nom}`}
                            className="w-full h-32 object-contain"
                            onClick={() => window.open(licence.arbitre.signature!, '_blank')}
                            title="Cliquer pour agrandir"
                          />
                        </div>
                      </div>
                    )}
                    {licence.arbitre.pieceIdentite && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Pièce d'identité</p>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors">
                          <img
                            src={licence.arbitre.pieceIdentite}
                            alt={`Pièce d'identité de ${licence.arbitre.prenom} ${licence.arbitre.nom}`}
                            className="w-full h-32 object-contain"
                            onClick={() => window.open(licence.arbitre.pieceIdentite!, '_blank')}
                            title="Cliquer pour agrandir"
                          />
                        </div>
                      </div>
                    )}
                    {licence.arbitre.certificatMedical && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Certificat médical</p>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors">
                          <img
                            src={licence.arbitre.certificatMedical}
                            alt={`Certificat médical de ${licence.arbitre.prenom} ${licence.arbitre.nom}`}
                            className="w-full h-32 object-contain"
                            onClick={() => window.open(licence.arbitre.certificatMedical!, '_blank')}
                            title="Cliquer pour agrandir"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informations de la licence */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Détails de la licence</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Saison</dt>
                    <dd className="mt-1 text-sm text-gray-900">{licence.saison.code}</dd>
                  </div>
                  {licence.numeroLicence && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Numéro de licence</dt>
                      <dd className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-gray-900 font-mono">{licence.numeroLicence}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(licence.numeroLicence!);
                            setToast({ message: 'Numéro de licence copié !', type: 'success' });
                            setTimeout(() => setToast(null), 3000);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          title="Copier le numéro de licence"
                        >
                          📋 Copier
                        </button>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date de soumission</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(licence.createdAt)}
                    </dd>
                  </div>
                  {licence.dateValidation && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date de validation</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(licence.dateValidation)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Messages */}
              {licence.statut === 'SOUMISE' && (
                <Alert type="info">
                  Votre demande de licence est en cours de traitement par un administrateur.
                  Vous recevrez un email dès qu'elle sera validée.
                </Alert>
              )}

              {licence.statut === 'VALIDEE' && (
                <>
                  {licence.paiement?.statut === 'VALIDE' ? (
                    <Alert type="success" title="Paiement effectué">
                      <p>Votre paiement a été enregistré avec succès.</p>
                      {licence.paiement.paidAt && (
                        <p className="text-sm mt-1">
                          Paiement reçu le {formatDate(licence.paiement.paidAt)}
                        </p>
                      )}
                    </Alert>
                  ) : (
                    <Alert type="info" title="Licence validée">
                      <p>Votre licence a été validée ! Veuillez procéder au paiement.</p>
                    </Alert>
                  )}
                </>
              )}

              {licence.statut === 'REJETEE' && (
                <div>
                  <Alert type="error" title="Licence rejetée">
                    {licence.commentaireAdmin ? (
                      <div>
                        <p className="font-medium">Raison du rejet :</p>
                        <p className="mt-1">{licence.commentaireAdmin}</p>
                      </div>
                    ) : (
                      <p>Votre demande de licence a été rejetée. Veuillez contacter l'administration pour plus d'informations.</p>
                    )}
                  </Alert>
                </div>
              )}

              {/* Statut de paiement */}
              {licence.statut === 'VALIDEE' && licence.paiement && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Statut du paiement</h4>
                  <div className="flex items-center gap-2">
                    {licence.paiement.statut === 'VALIDE' ? (
                      <>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Paiement effectué
                        </span>
                        {licence.paiement.paidAt && (
                          <span className="text-xs text-gray-600">
                            Le {formatDate(licence.paiement.paidAt)}
                          </span>
                        )}
                      </>
                    ) : licence.paiement.statut === 'EN_ATTENTE' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⏳ Paiement en attente
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ✗ Paiement échoué
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Link href="/" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Retour à l'accueil
                  </Button>
                </Link>
                {licence.statut === 'VALIDEE' && licence.paiement?.statut === 'VALIDE' && (
                  <Button
                    className="w-full flex-1"
                    onClick={async () => {
                      setIsDownloading(true);
                      try {
                        // L'API redirige vers Firebase Storage
                        const downloadUrl = `/api/licences/download?numeroLicence=${encodeURIComponent(licence.numeroLicence!)}&dateNaissance=${encodeURIComponent(new Date(licence.arbitre.dateNaissance).toISOString().split('T')[0])}&telephone=${encodeURIComponent(licence.arbitre.telephone.replace(/\s/g, '').replace(/^\+225/, ''))}`;

                        const response = await fetch(downloadUrl, {
                          method: 'GET',
                          redirect: 'follow',
                        });

                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `licence-arbitre-${licence.numeroLicence || licence.id}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } else {
                          const data = await response.json().catch(() => ({ message: 'Erreur lors du téléchargement' }));
                          setToast({ message: data.message || 'Erreur lors du téléchargement', type: 'error' });
                        }
                      } catch (err) {
                        console.error('Erreur téléchargement:', err);
                        setToast({ message: 'Erreur lors du téléchargement. Veuillez réessayer.', type: 'error' });
                      } finally {
                        setIsDownloading(false);
                      }
                    }}
                    isLoading={isDownloading}
                    disabled={isDownloading}
                  >
                    Télécharger ma licence
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Aide */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Vous avez perdu votre numéro de licence ?{' '}
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

export default function SuiviArbitrePage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SuiviArbitreContent />
    </Suspense>
  );
}
