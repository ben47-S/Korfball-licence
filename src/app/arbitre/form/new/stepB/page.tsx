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
import type { ArbitreFormData } from '../../types';
import { formatTelephone } from '@/lib/utils';

export default function StepBPage() {
  const router = useRouter();
  const { formData, updateFormData, isHydrated } = useFormData();
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const handleArbitreChange = (field: keyof ArbitreFormData, value: string) => {
    updateFormData({
      arbitre: {
        ...formData.arbitre,
        [field]: value,
      },
    });
  };

  const handleNext = () => {
    // Validation des champs obligatoires
    if (
      !formData.arbitre.nom ||
      !formData.arbitre.prenom ||
      !formData.arbitre.dateNaissance ||
      !formData.arbitre.sexe ||
      !formData.arbitre.nationalite ||
      !formData.arbitre.numeroPieceIdentite ||
      !formData.arbitre.telephone ||
      !formData.arbitre.niveauArbitre ||
      !formData.arbitre.dateCertification ||
      !formData.arbitre.numeroCertificat ||
      !formData.arbitre.autoriteCertificatrice ||
      !formData.arbitre.zoneAffectation ||
      !formData.arbitre.certificatMedicalValide ||
      !formData.arbitre.assuranceActive
    ) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Valider le format du téléphone (10 chiffres)
    const phoneDigits = formData.arbitre.telephone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Le téléphone doit contenir exactement 10 chiffres');
      return;
    }

    // Validation : si certificat médical valide = oui, date d'expiration obligatoire
    if (formData.arbitre.certificatMedicalValide === 'oui' && !formData.arbitre.dateExpirationCertificatMedical) {
      setError('La date d\'expiration du certificat médical est obligatoire si le certificat est valide');
      return;
    }

    setError('');
    router.push('/arbitre/form/new/stepC');
  };

  const handleBack = () => {
    router.push('/arbitre/form/new/stepA');
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
  useEffect(() => {
    if (!isHydrated) return;
    
    if (!formData.type || !formData.saisonId) {
      router.replace('/arbitre/form/new/stepA');
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
            Inscription Licence Arbitre Korfball
          </h1>
        </div>

        <StepIndicator currentStep="stepB" type="new" />

        {error && (
          <div className="mb-6">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <Card>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Étape 2 : Informations de l'arbitre
            </h2>

            {/* Informations personnelles */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations personnelles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nom"
                  required
                  value={formData.arbitre.nom}
                  onChange={(e) => handleArbitreChange('nom', e.target.value)}
                />

                <Input
                  label="Prénom"
                  required
                  value={formData.arbitre.prenom}
                  onChange={(e) => handleArbitreChange('prenom', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date de naissance"
                  type="date"
                  required
                  value={formData.arbitre.dateNaissance}
                  onChange={(e) => handleArbitreChange('dateNaissance', e.target.value)}
                />

                <Select
                  label="Sexe"
                  required
                  value={formData.arbitre.sexe}
                  onChange={(e) => handleArbitreChange('sexe', e.target.value)}
                  showPlaceholder={false}
                  options={[
                    { value: '', label: 'Sélectionnez' },
                    { value: 'M', label: 'Masculin' },
                    { value: 'F', label: 'Féminin' },
                    { value: 'Autre', label: 'Autre' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nationalité"
                  required
                  value={formData.arbitre.nationalite}
                  onChange={(e) => handleArbitreChange('nationalite', e.target.value)}
                />

                <Input
                  label="Numéro de pièce d'identité"
                  required
                  value={formData.arbitre.numeroPieceIdentite}
                  onChange={(e) => handleArbitreChange('numeroPieceIdentite', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Téléphone"
                  type="tel"
                  required
                  prefix="+225"
                  value={formData.arbitre.telephone.replace(/^\+225/, '')}
                  onChange={(e) => {
                    const formatted = formatTelephone(e.target.value);
                    handleArbitreChange('telephone', formatted);
                  }}
                  placeholder="0123456789"
                  helperText="Entrez les 10 chiffres du numéro (ex: 0123456789)"
                  maxLength={10}
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.arbitre.email}
                  onChange={(e) => handleArbitreChange('email', e.target.value)}
                  helperText="Pour recevoir la confirmation d'inscription"
                />
              </div>

              <Input
                label="Adresse"
                value={formData.arbitre.adresse}
                onChange={(e) => handleArbitreChange('adresse', e.target.value)}
                helperText="Optionnel"
              />
            </div>

            {/* Informations d'arbitrage */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations d'arbitrage</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Niveau arbitre"
                  required
                  value={formData.arbitre.niveauArbitre}
                  onChange={(e) => handleArbitreChange('niveauArbitre', e.target.value)}
                  showPlaceholder={false}
                  options={[
                    { value: '', label: 'Sélectionnez' },
                    { value: 'local', label: 'Local' },
                    { value: 'regional', label: 'Régional' },
                    { value: 'national', label: 'National' },
                    { value: 'international', label: 'International' },
                  ]}
                />

                <Input
                  label="Date de certification"
                  type="date"
                  required
                  value={formData.arbitre.dateCertification}
                  onChange={(e) => handleArbitreChange('dateCertification', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Numéro de certificat"
                  required
                  value={formData.arbitre.numeroCertificat}
                  onChange={(e) => handleArbitreChange('numeroCertificat', e.target.value)}
                />

                <Input
                  label="Autorité certificatrice"
                  required
                  value={formData.arbitre.autoriteCertificatrice}
                  onChange={(e) => handleArbitreChange('autoriteCertificatrice', e.target.value)}
                  helperText="Fédération nationale ou organisme reconnu"
                />
              </div>

              <Input
                label="Zone d'affectation"
                required
                value={formData.arbitre.zoneAffectation}
                onChange={(e) => handleArbitreChange('zoneAffectation', e.target.value)}
                helperText="Ligue / région / district"
              />
            </div>

            {/* Certificat médical et assurance */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Certificat médical et assurance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Certificat médical valide"
                  required
                  value={formData.arbitre.certificatMedicalValide}
                  onChange={(e) => handleArbitreChange('certificatMedicalValide', e.target.value)}
                  showPlaceholder={false}
                  options={[
                    { value: '', label: 'Sélectionnez' },
                    { value: 'oui', label: 'Oui' },
                    { value: 'non', label: 'Non' },
                  ]}
                />

                {formData.arbitre.certificatMedicalValide === 'oui' && (
                  <Input
                    label="Date d'expiration certificat médical"
                    type="date"
                    required
                    value={formData.arbitre.dateExpirationCertificatMedical}
                    onChange={(e) => handleArbitreChange('dateExpirationCertificatMedical', e.target.value)}
                  />
                )}
              </div>

              <Select
                label="Assurance active"
                required
                value={formData.arbitre.assuranceActive}
                onChange={(e) => handleArbitreChange('assuranceActive', e.target.value)}
                showPlaceholder={false}
                options={[
                  { value: '', label: 'Sélectionnez' },
                  { value: 'oui', label: 'Oui' },
                  { value: 'non', label: 'Non' },
                ]}
              />
            </div>

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

