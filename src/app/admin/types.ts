export interface Saison {
  id: string;
  code: string;
  debut: string;
  fin: string;
  inscriptionDebut: string;
  inscriptionFin: string;
  enCours: boolean;
}

export interface Club {
  id: string;
  nom: string;
  ville: string; // Obligatoire
  pays: string; // Obligatoire
}

export interface Responsable {
  id: string;
  nom: string;
  prenom: string;
  telephone: string; // Obligatoire
  email: string | null;
  lien: string;
}

export interface Joueur {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string; // Obligatoire
  dateNaissance: string;
  lieuNaissance: string; // Obligatoire
  nationalite: string; // Obligatoire
  sexe: string; // Obligatoire
  numeroLicence: string | null;
  photo: string | null; // Optionnel
  signature: string | null; // Optionnel
  pieceIdentite: string | null; // Obligatoire pour NOUVEAU
  certificatMedical: string | null; // Obligatoire pour NOUVEAU
  responsables: Responsable[];
}

export interface Paiement {
  id: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'ECHOUE';
  paidAt: string | null;
  montant: number;
  devise: string;
}

export interface Licence {
  id: string;
  statut: 'BROUILLON' | 'SOUMISE' | 'EN_CORRECTION' | 'VALIDEE' | 'REJETEE';
  type: 'NOUVEAU' | 'RENOUVELLEMENT';
  dateValidation: string | null;
  commentaireAdmin: string | null;
  createdAt: string;
  joueur: Joueur;
  saison: Saison;
  clubActuel: Club | null;
  clubPrecedent: Club | null;
  paiement: Paiement | null;
}

