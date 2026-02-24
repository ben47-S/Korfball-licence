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

export interface JoueurFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string; // Obligatoire
  dateNaissance: string;
  lieuNaissance: string; // Obligatoire
  nationalite: string; // Obligatoire
  sexe: string; // Obligatoire
  photo: string; // Optionnel
  signature: string; // Optionnel
  pieceIdentite: string; // Obligatoire pour NOUVEAU
  certificatMedical: string; // Obligatoire pour NOUVEAU
}

export interface ResponsableFormData {
  nom: string;
  prenom: string;
  telephone: string; // Obligatoire
  email: string;
  lien: string;
}

export interface FormData {
  type: string;
  saisonId: string;
  joueur: JoueurFormData;
  responsables: ResponsableFormData[];
  numeroLicencePrecedent: string;
  clubPrecedentId: string;
  clubActuelId: string;
}

