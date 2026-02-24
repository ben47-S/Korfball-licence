////////////////// INSCRIPTIONS //////////////////////

POST /api/inscriptions
Description: Créer une nouvelle inscription de licence (SOUMISE directement)
Auth: Public (pas d'authentification requise)
Body: {
  type: "NOUVEAU" | "RENOUVELLEMENT",
  saisonId: string (uuid),
  joueur: {
    nom: string,
    prenom: string,
    email?: string,
    telephone?: string,
    dateNaissance: string (ISO),
    lieuNaissance?: string,
    nationalite?: string,
    sexe?: "M" | "F" | "Autre",
    photo?: string (url),
    signature?: string
  },
  responsables?: Array<{
    nom: string,
    prenom: string,
    telephone?: string,
    email?: string,
    lien: "PERE" | "MERE" | "TUTEUR"
  }>,
  clubPrecedentId?: string (uuid, obligatoire si RENOUVELLEMENT),
  clubActuelId?: string (uuid)
}
Response: {
  success: true,
  message: string,
  accessKey: string (UUID - à conserver précieusement)
}

GET /api/inscriptions?accessKey=xxx
Description: Récupérer une licence complète par son accessKey
Auth: Protégé par accessKey (pas besoin de JWT)
Query: accessKey (uuid)
Response: Licence complète avec relations (joueur, responsables, clubs, saison, paiement)

GET /api/inscriptions/statut?accessKey=xxx
Description: Vérifier le statut d'une licence (version light)
Auth: Protégé par accessKey
Query: accessKey (uuid)
Response: {
  id: string,
  statut: "BROUILLON" | "SOUMISE" | "VALIDEE" | "REJETEE",
  numeroLicence?: number,
  dateValidation?: string,
  commentaireAdmin?: string
}

////////////////// LICENCES (Admin) //////////////////////

POST /api/licences
PATCH /api/licences/soumettre
PATCH /api/licences/valider
PATCH /api/licences/rejeter