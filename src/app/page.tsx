'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Alert from '@/components/ui/Alert';
import { formatDate } from '@/lib/date-utils';
import { useLoading } from '@/contexts/LoadingContext';

interface Saison {
  id: string;
  code: string;
  debut: string;
  fin: string;
  inscriptionDebut: string;
  inscriptionFin: string;
  enCours: boolean;
}

export default function HomePage() {
  const [saisonEnCours, setSaisonEnCours] = useState<Saison | null>(null);
  const [saisonFuture, setSaisonFuture] = useState<Saison | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();

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
    let cancelled = false;

    const loadSaison = async () => {
      setGlobalLoading(true);
      try {
        // Récupérer toutes les saisons et trouver celle qui est en cours
        // (même si les inscriptions sont terminées, tant que la saison n'est pas terminée)
        const response = await fetch('/api/saisons');
        if (response.ok && !cancelled) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            const maintenant = new Date();
            // Trouver la saison en cours (enCours = true) ou la saison dont la date de fin n'est pas encore passée
            const saison = data.data.find((s: Saison) => {
              const finSaison = new Date(s.fin);
              return s.enCours || (finSaison >= maintenant);
            });
            if (saison && !cancelled) {
              setSaisonEnCours(saison);
            } else if (!cancelled) {
              // Chercher une saison future (inscriptionDebut dans le futur)
              const saisonFut = data.data.find((s: Saison) => {
                const debutInscriptions = new Date(s.inscriptionDebut);
                return debutInscriptions > maintenant;
              });
              if (saisonFut) {
                setSaisonFuture(saisonFut);
              }
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Erreur lors du chargement de la saison:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setGlobalLoading(false);
        }
      }
    };

    loadSaison();

    return () => {
      cancelled = true;
    };
  }, []); // Pas de dépendances pour éviter les re-exécutions

  // Vérifier si les inscriptions sont terminées
  const inscriptionsTerminees = saisonEnCours 
    ? new Date(saisonEnCours.inscriptionFin) < new Date()
    : false;

  // Vérifier si la saison est terminée
  const saisonTerminee = saisonEnCours
    ? new Date(saisonEnCours.fin) < new Date()
    : false;

  // Afficher le message si les inscriptions sont terminées mais la saison est encore en cours
  const afficherMessageInscriptionsTerminees = inscriptionsTerminees && !saisonTerminee;
  
  // Aucune saison disponible
  const aucuneSaisonDisponible = !saisonEnCours && !loading;

  return (
    <div className="min-h-screen bg-white relative">
      {/* Logo en arrière-plan */}
      <div 
        className="fixed inset-0 opacity-20 md:opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/images/logoKorfball.jpg)',
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
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="block text-indigo-600 mt-2">Bienvenue sur le site de gestion des licences </span>
            {saisonEnCours && !saisonTerminee && (
              <span className="block text-2xl text-indigo-500 mt-4">
                Saison {saisonEnCours.code}
              </span>
            )}
          </h1>
          
          {afficherMessageInscriptionsTerminees ? (
            <div className="mb-12 max-w-3xl mx-auto">
              <Alert type="warning">
                <strong>La période des inscriptions pour la saison en cours est passée</strong>
                {saisonEnCours && (
                  <p className="mt-2 text-sm">
                    Les inscriptions étaient ouvertes du {formatDate(saisonEnCours.inscriptionDebut)} au {formatDate(saisonEnCours.inscriptionFin)}.
                  </p>
                )}
              </Alert>
            </div>
          ) : aucuneSaisonDisponible ? (
            <div className="mb-12 max-w-3xl mx-auto">
              {saisonFuture ? (
                <Alert type="info">
                  <strong>Nouvelle saison à venir</strong>
                  <p className="mt-2 text-sm">
                    Les inscriptions pour la saison <strong>{saisonFuture.code}</strong> ouvriront le <strong>{formatDate(saisonFuture.inscriptionDebut)}</strong>.
                  </p>
                </Alert>
              ) : (
                <Alert type="warning">
                  <strong>Aucune saison disponible pour le moment</strong>
                </Alert>
              )}
            </div>
          ) : (
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Inscrivez-vous en ligne pour obtenir votre licence de korfball.
              Un processus simple et rapide.
            </p>
          )}

          {!afficherMessageInscriptionsTerminees && !aucuneSaisonDisponible && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {/* Bloc Joueur */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg border-2 border-indigo-200 p-8 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-indigo-700 mb-2">Joueur</h2>
                  <p className="text-indigo-600 text-sm">Gérez votre licence de joueur</p>
                </div>
                <div className="flex flex-col gap-4">
                  <Link
                    href="/inscription/form/new"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Nouvelle licence
                  </Link>
                  <Link
                    href="/inscription/form/reNew"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg border-2 border-indigo-600 transform hover:-translate-y-0.5"
                  >
                    Renouvellement
                  </Link>
                  {saisonEnCours && !saisonTerminee && (
                    <Link
                      href="/inscription/suivi"
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg border-2 border-indigo-600 transform hover:-translate-y-0.5"
                    >
                      Suivi
                    </Link>
                  )}
                </div>
              </div>

              {/* Bloc Arbitre */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border-2 border-purple-200 p-8 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-purple-700 mb-2">Arbitre</h2>
                  <p className="text-purple-600 text-sm">Gérez votre licence d'arbitre</p>
                </div>
                <div className="flex flex-col gap-4">
                  <Link
                    href="/arbitre/form/new"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Nouvelle licence
                  </Link>
                  <Link
                    href="/arbitre/form/reNew"
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-purple-600 bg-white hover:bg-purple-50 transition-all shadow-md hover:shadow-lg border-2 border-purple-600 transform hover:-translate-y-0.5"
                  >
                    Renouvellement
                  </Link>
                  {saisonEnCours && !saisonTerminee && (
                    <Link
                      href="/arbitre/suivi"
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-purple-600 bg-white hover:bg-purple-50 transition-all shadow-md hover:shadow-lg border-2 border-purple-600 transform hover:-translate-y-0.5"
                    >
                      Suivi
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Simple et rapide</h3>
            <p className="text-gray-600">
              Remplissez le formulaire en quelques minutes. Processus guidé étape par étape.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Suivi en temps réel</h3>
            <p className="text-gray-600">
              Suivez l'état de votre demande à tout moment avec votre numéro de licence.
            </p>
          </div>
        </div>

        {/* Process Steps - Affichés uniquement si les inscriptions sont ouvertes */}
        {!afficherMessageInscriptionsTerminees && !aucuneSaisonDisponible && (
          <div className="mt-18">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Comment ça marche ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: 1, title: 'Remplir le formulaire', desc: 'Remplissez avec soin le formulaire d\'inscription pout avoir votre licence' },
                { step: 2, title: 'Recevoir votre numéro', desc: 'Vous recevez votre numéro de licence unique par email pour consulter l\'état de votre demande' },
                { step: 3, title: 'Validation admin', desc: 'L\'administrateur valide votre demande et vous envoie un message de confirmation' },
                { step: 4, title: 'Paiement', desc: 'Après validation procéder au paiement pour pouvoir télécharger votre licence' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
