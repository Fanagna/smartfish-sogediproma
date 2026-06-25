const { describe, it, before, after, mock } = require('node:test')
const assert = require('node:assert')

// ─── Mocks ───
const mockPrisma = {
  capture: {
    findMany: mock.fn(),
    groupBy: mock.fn(),
    aggregate: mock.fn(),
  },
  stock: { findMany: mock.fn() },
  bateau: { findMany: mock.fn() },
  maintenance: { findMany: mock.fn() },
  vente: { findMany: mock.fn() },
  exportation: { findMany: mock.fn() },
  anomalie: { findMany: mock.fn(), create: mock.fn() },
  fraude: { create: mock.fn() },
  rapport: { create: mock.fn() },
  decisionLog: { create: mock.fn() },
}

mock.module('../src/config/database', { default: mockPrisma, namedExports: true })

// Mock cache service (pour éviter les vrais appels DB dans les tests)
const mockCacheData = {
  captures: [{ id: 1, espece: 'Thon', poids: 150, quantite: 10, zonePeche: 'Zone A', date: new Date(), bateau: { nom: 'Albatros' } }],
  stocks: [{ id: 1, espece: 'Thon', quantite: 500, unite: 'kg', seuil: 50, alerte: false, dateSortie: null, bateau: { nom: 'Albatros' } }],
  bateaux: [{ id: 1, nom: 'Albatros', immatriculation: 'SF-001', type: 'Chalutier', longueur: 12, carburantCapacity: 500, carburantRestant: 400, capitaineId: 1, capitaine: { id: 1, nom: 'Admin', prenom: 'Test' } }],
  maintenances: [{ id: 1, bateauId: 1, type: 'MOTEUR', description: 'Révision', statut: 'PLANIFIEE', cout: 500, date: new Date(), bateau: { nom: 'Albatros' } }],
  ventes: [{ id: 1, espece: 'Thon', quantite: 50, total: 1500, prixUnitaire: 30, typeClient: 'LOCAL', date: new Date(), stock: { bateau: { nom: 'Albatros' } }, user: { nom: 'Admin', prenom: 'Test' } }],
  exportations: [{ id: 1, espece: 'Thon', quantite: 100, prixTotal: 5000, paysDestination: 'France', statut: 'EN_COURS', date: new Date(), stock: { espece: 'Thon' }, user: { nom: 'Admin', prenom: 'Test' } }],
  anomalies: [{ id: 1, description: 'Stock bas', type: 'STOCK', urgence: 'HAUTE', statut: 'EN_ATTENTE', date: new Date(), user: { nom: 'Admin', prenom: 'Test' } }],
}

const mockCacheService = {
  getFullContext: mock.fn(() => mockCacheData),
  getLightContext: mock.fn(() => ({ captures: mockCacheData.captures, stocks: mockCacheData.stocks })),
  getPredictionsContext: mock.fn(() => ({ ventes: mockCacheData.ventes, exportations: mockCacheData.exportations, stocks: mockCacheData.stocks })),
  getFleetContext: mock.fn(() => ({ bateaux: mockCacheData.bateaux, captures: mockCacheData.captures, maintenances: mockCacheData.maintenances })),
  getStats30j: mock.fn(() => ({ _count: { _all: 10 }, _sum: { poids: 500, quantite: 100 } })),
}

mock.module('../src/services/iaContextService', {
  default: mockCacheService,
  namedExports: {
    getFullContext: mockCacheService.getFullContext,
    getLightContext: mockCacheService.getLightContext,
    getPredictionsContext: mockCacheService.getPredictionsContext,
    getFleetContext: mockCacheService.getFleetContext,
    getStats30j: mockCacheService.getStats30j,
    invalidateAll: () => {},
  },
})

// Mock Gemini AI
const mockModel = {
  generateContent: mock.fn(),
}

const mockGenAI = {
  getGenerativeModel: () => mockModel,
}

mock.module('@google/generative-ai', {
  default: function() { return mockGenAI },
  GoogleGenerativeAI: function() { return mockGenAI },
  namedExports: { GoogleGenerativeAI: function() { return mockGenAI } },
})

const iaService = require('../src/services/iaService')

// Nouveaux contrôleurs découpés
const iaPredictionsController = require('../src/controllers/iaPredictionsController')
const iaAnalysisController = require('../src/controllers/iaAnalysisController')
const iaChatController = require('../src/controllers/iaChatController')

function mockReqRes(overrides = {}) {
  const req = {
    query: {},
    params: {},
    body: {},
    user: { id: 1, role: 'ADMIN' },
    ...overrides,
  }
  const res = {
    json: mock.fn(() => res),
    status: mock.fn(() => res),
    send: mock.fn(() => res),
  }
  return { req, res }
}

describe('🧠 Service IA', () => {
  after(() => mock.reset())

  describe('askGemini()', () => {
    it("devrait parser une réponse JSON valide de Gemini", async () => {
      const mockJsonResponse = JSON.stringify({
        predictionCaptures: [
          { espece: 'Thon rouge', probabilite: 85 },
          { espece: 'Sardine', probabilite: 72 },
        ],
        predictionStocks: [
          { espece: 'Cabillaud', statut: 'insuffisant', recommandation: 'Acheter urgemment' },
        ],
      })

      mockModel.generateContent.mock.mockImplementation(() => ({
        response: { text: () => mockJsonResponse },
      }))
      mockPrisma.decisionLog.create.mock.mockImplementation(() => ({}))

      const result = await iaService.askGemini('Test prompt', { test: true }, 'TEST')

      assert.ok(result.predictionCaptures)
      assert.equal(result.predictionCaptures.length, 2)
      assert.equal(result.predictionCaptures[0].espece, 'Thon rouge')
      assert.equal(result.predictionStocks[0].statut, 'insuffisant')
    })

    it("devrait nettoyer les balises markdown de la réponse Gemini", async () => {
      mockModel.generateContent.mock.mockImplementation(() => ({
        response: { text: () => '```json\n{"test": "value"}\n```' },
      }))
      mockPrisma.decisionLog.create.mock.mockImplementation(() => ({}))

      const result = await iaService.askGemini('Test', {}, 'TEST')
      assert.equal(result.test, 'value')
    })

    it('devrait rejeter une réponse non-JSON', async () => {
      mockModel.generateContent.mock.mockImplementation(() => ({
        response: { text: () => 'Ceci nest pas du JSON' },
      }))
      mockPrisma.decisionLog.create.mock.mockImplementation(() => ({}))

      await assert.rejects(
        () => iaService.askGemini('Test', {}, 'TEST'),
        { message: 'Réponse Gemini invalide (JSON attendu)' }
      )
    })
  })
})

describe('🧠 Controller IA', () => {
  after(() => mock.reset())

  describe('getPredictions()', () => {
    it('devrait retourner les prédictions IA3/IA11 (via cache)', async () => {
      mockModel.generateContent.mock.mockImplementation(() => ({
        response: { text: () => JSON.stringify({
          predictionCaptures: [{ espece: 'Thon rouge', probabilite: 85 }],
          predictionStocks: [{ espece: 'Cabillaud', statut: 'insuffisant', recommandation: 'test' }],
        }) },
      }))
      mockPrisma.decisionLog.create.mock.mockImplementation(() => ({}))

      const { req, res } = mockReqRes()
      await iaPredictionsController.getPredictions(req, res, () => {})

      assert.ok(res.json.mock.calls.length, 1)
      const result = res.json.mock.calls[0].arguments[0]
      assert.ok(result.predictionCaptures)
      // Vérifie que le cache a été utilisé
      assert.ok(mockCacheService.getLightContext.mock.calls.length > 0)
    })
  })

  describe('chatAssistant()', () => {
    it('devrait répondre à une question', async () => {
      mockModel.generateContent.mock.mockImplementation(() => ({
        response: { text: () => JSON.stringify({ reponse: 'Voici les KPIs...' }) },
      }))
      mockPrisma.decisionLog.create.mock.mockImplementation(() => ({}))

      const { req, res } = mockReqRes({
        body: { question: 'Donne moi les KPIs', history: [] },
      })

      await iaChatController.chatAssistant(req, res, () => {})

      const result = res.json.mock.calls[0].arguments[0]
      assert.ok(result.reponse)
      // Vérifie que le cache a été utilisé
      assert.ok(mockCacheService.getFullContext.mock.calls.length > 0)
      assert.ok(mockCacheService.getStats30j.mock.calls.length > 0)
    })

    it('devrait rejeter une question vide', async () => {
      const { req, res } = mockReqRes({ body: { question: '', history: [] } })

      await iaChatController.chatAssistant(req, res, () => {})

      assert.equal(res.status.mock.calls[0]?.arguments[0], 400)
    })
  })

  describe('getZones()', () => {
    it('devrait retourner les zones de pêche', async () => {
      mockModel.generateContent.mock.mockImplementation(() => ({
        response: { text: () => JSON.stringify({
          zones: [
            { nom: 'Zone A', espece: 'Thon rouge', moment: 'Matin', justification: 'Fortes captures récentes' },
          ],
        }) },
      }))
      mockPrisma.decisionLog.create.mock.mockImplementation(() => ({}))

      const { req, res } = mockReqRes()
      await iaPredictionsController.getZones(req, res, () => {})

      const result = res.json.mock.calls[0].arguments[0]
      assert.ok(result.zones)
      assert.equal(result.zones[0].nom, 'Zone A')
    })
  })

  describe('generateReport()', () => {
    it('devrait générer un rapport pour un type valide', async () => {
      // generateReport utilise encore Prisma directement (données filtrées par date)
      mockPrisma.capture.findMany.mock.mockImplementation(() => [])
      mockPrisma.stock.findMany.mock.mockImplementation(() => [])
      mockPrisma.bateau.findMany.mock.mockImplementation(() => [])
      mockPrisma.maintenance.findMany.mock.mockImplementation(() => [])
      mockPrisma.vente.findMany.mock.mockImplementation(() => [])
      mockPrisma.exportation.findMany.mock.mockImplementation(() => [])
      mockPrisma.anomalie.findMany.mock.mockImplementation(() => [])

      mockModel.generateContent.mock.mockImplementation(() => ({
        response: { text: () => JSON.stringify({
          titre: 'Rapport journalier',
          contenu: '# Résumé\n\nKPIs du jour...',
        }) },
      }))
      mockPrisma.decisionLog.create.mock.mockImplementation(() => ({}))
      mockPrisma.rapport.create.mock.mockImplementation(({ data }) => ({ id: 1, ...data }))

      const { req, res } = mockReqRes({ query: { type: 'journalier' } })
      await iaAnalysisController.generateReport(req, res, () => {})

      const result = res.json.mock.calls[0].arguments[0]
      assert.ok(result.rapport)
      assert.ok(result.contenu)
    })

    it('devrait rejeter un type invalide', async () => {
      const { req, res } = mockReqRes({ query: { type: 'invalide' } })
      await iaAnalysisController.generateReport(req, res, () => {})

      assert.equal(res.status.mock.calls[0]?.arguments[0], 400)
    })
  })

  describe('detectFraud()', () => {
    it('devrait détecter des fraudes et les enregistrer', async () => {
      mockModel.generateContent.mock.mockImplementation(() => ({
        response: { text: () => JSON.stringify({
          fraudesDetectees: [
            { description: 'Écart de stock suspect', type: 'ecart_stock', niveauRisque: 'élevé', donneesConcernees: 'Stock thon' },
          ],
        }) },
      }))
      mockPrisma.decisionLog.create.mock.mockImplementation(() => ({}))
      mockPrisma.fraude.create.mock.mockImplementation(({ data }) => ({ id: 1, ...data }))

      const { req, res } = mockReqRes()
      await iaAnalysisController.detectFraud(req, res, () => {})

      const result = res.json.mock.calls[0].arguments[0]
      assert.ok(result.fraudes)
      assert.equal(result.fraudes.length, 1)
      assert.equal(result.fraudes[0].niveauRisque, 'élevé')
    })
  })
})
