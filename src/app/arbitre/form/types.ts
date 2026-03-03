export interface Saison {
  id: string;
  code: string;
  debut: string;
  fin: string;
  inscriptionDebut: string;
  inscriptionFin: string;
  enCours: boolean;
}

export interface ArbitreFormData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string; // Obligatoire
  nationalite: string; // Obligatoire
  numeroPieceIdentite: string; // Obligatoire
  telephone: string; // Obligatoire
  email: string;
  adresse: string; // Optionnel
  niveauArbitre: string; // local / régional / national / international
  dateCertification: string;
  numeroCertificat: string;
  autoriteCertificatrice: string; // Fédération nationale ou organisme reconnu
  zoneAffectation: string; // Ligue / région / district
  certificatMedicalValide: string; // oui/non
  dateExpirationCertificatMedical: string;
  assuranceActive: string; // oui/non
  photo: string; // Optionnel
  signature: string; // Optionnel
  pieceIdentite: string; // Obligatoire pour NOUVEAU
  certificatMedical: string; // Obligatoire pour NOUVEAU
}

export interface FormData {
  type: string;
  saisonId: string;
  arbitre: ArbitreFormData;
  numeroLicencePrecedent: string;
}

