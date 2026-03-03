'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import { useFormData } from '../../hooks/useFormData';
import StepIndicator from '../../components/StepIndicator';
import type { JoueurFormData } from '../../types';
import { formatTelephone, validateTelephone, formatTelephoneComplete } from '@/lib/utils';

export default function StepBPage() {
  const router = useRouter();
  const { formData, updateFormData, isHydrated } = useFormData();
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

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

  const handleJoueurChange = (field: keyof JoueurFormData, value: string) => {
    updateFormData({
      joueur: {
        ...formData.joueur,
        [field]: value,
      },
    });
  };

  const handleNext = () => {
    if (
      !formData.joueur.nom ||
      !formData.joueur.prenom ||
      !formData.joueur.dateNaissance ||
      !formData.joueur.sexe ||
      !formData.joueur.telephone ||
      !formData.joueur.lieuNaissance ||
      !formData.joueur.nationalite
    ) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Valider le format du téléphone (10 chiffres)
    const phoneDigits = formData.joueur.telephone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Le téléphone doit contenir exactement 10 chiffres');
      return;
    }

    setError('');
    router.push('/inscription/form/new/stepC');
  };

  const handleBack = () => {
    router.push('/inscription/form/new/stepA');
  };

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rediriger si l'étape 1 n'est pas complétée
  // Attendre que les données soient chargées depuis localStorage avant de vérifier
  useEffect(() => {
    // Ne vérifier qu'après l'hydratation
    if (!isHydrated) return;
    
    // Vérifier si les données requises sont présentes
    if (!formData.type || !formData.saisonId) {
      router.replace('/inscription/form/new/stepA');
    }
  }, [isHydrated, formData.type, formData.saisonId, router]);

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
            Inscription Licence Korfball
          </h1>
        </div>

        <StepIndicator currentStep="stepB" />

        {error && (
          <div className="mb-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <Card>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Étape 2 : Informations du joueur
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom"
                required
                value={formData.joueur.nom}
                onChange={(e) => handleJoueurChange('nom', e.target.value)}
              />

              <Input
                label="Prénom"
                required
                value={formData.joueur.prenom}
                onChange={(e) => handleJoueurChange('prenom', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date de naissance"
                type="date"
                required
                value={formData.joueur.dateNaissance}
                onChange={(e) => handleJoueurChange('dateNaissance', e.target.value)}
              />

              <Select
                label="Sexe"
                required
                value={formData.joueur.sexe}
                onChange={(e) => handleJoueurChange('sexe', e.target.value)}
                options={[
                  { value: 'M', label: 'Masculin' },
                  { value: 'F', label: 'Féminin' },
                  { value: 'Autre', label: 'Autre' },
                ]}
              />
            </div>

            {age > 0 && (
              <Alert type={isMineur ? 'warning' : 'info'}>
                {isMineur
                  ? `Le joueur est mineur (${age} ans). Au moins un responsable légal est obligatoire.`
                  : `Le joueur est majeur (${age} ans). Les responsables sont optionnels.`}
              </Alert>
            )}

            <Input
              label="Email"
              type="email"
              value={formData.joueur.email}
              onChange={(e) => handleJoueurChange('email', e.target.value)}
              helperText="Pour recevoir la confirmation d'inscription"
            />

            <Input
              label="Téléphone"
              type="tel"
              required
              prefix="+225"
              value={formData.joueur.telephone.replace(/^\+225/, '')}
              onChange={(e) => {
                const formatted = formatTelephone(e.target.value);
                handleJoueurChange('telephone', formatted);
              }}
              placeholder="0123456789"
              helperText="Entrez les 10 chiffres du numéro (ex: 0123456789)"
              maxLength={10}
            />

            <Input
              label="Lieu de naissance"
              required
              value={formData.joueur.lieuNaissance}
              onChange={(e) => handleJoueurChange('lieuNaissance', e.target.value)}
            />

            <Input
              label="Nationalité"
              required
              value={formData.joueur.nationalite}
              onChange={(e) => handleJoueurChange('nationalite', e.target.value)}
            />

            <div className="flex justify-between pt-4 border-t">
              <Button onClick={handleBack} type="button" variant="secondary">
                ← Retour
              </Button>
              <Button onClick={handleNext} type="button">
                Suivant →
              </Button>
            </div>
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}

