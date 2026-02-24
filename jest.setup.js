// Setup pour Jest
// Ce fichier est exécuté avant chaque test

// Mock des variables d'environnement pour les tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'test-secret-key-for-jwt'
process.env.NODE_ENV = 'test'

// Optionnel: Mock de Prisma Client pour les tests unitaires
// Décommenter si vous voulez mocker Prisma complètement
/*
jest.mock('./src/lib/prisma', () => ({
  __esModule: true,
  default: {
    joueur: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    licence: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    saison: {
      findUnique: jest.fn(),
    },
    club: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      joueur: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      licence: {
        create: jest.fn(),
      },
      responsable: {
        createMany: jest.fn(),
      },
    })),
  },
}))
*/

// Augmenter le timeout pour les tests d'intégration
jest.setTimeout(10000)
