const { describe, it, before, after, mock } = require('node:test')
const assert = require('node:assert')

// Mock Prisma
const mockPrisma = {
  capture: {
    findMany: mock.fn(),
    findUnique: mock.fn(),
    create: mock.fn(),
    update: mock.fn(),
    delete: mock.fn(),
    count: mock.fn(),
  },
  bateau: { count: mock.fn() },
  stock: { findMany: mock.fn() },
  anomalie: { count: mock.fn() },
}

mock.module('../src/config/database', { default: mockPrisma, namedExports: true })

const captureController = require('../src/controllers/captureController')

// Helper: mock request/response
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

describe('🎣 Controller Captures', () => {
  after(() => mock.reset())

  describe('getCaptures()', () => {
    it('devrait retourner une liste paginée', async () => {
      const mockCaptures = [
        { id: 1, espece: 'Thon rouge', poids: 150, quantite: 10, zonePeche: 'Zone A', date: new Date(), bateau: { nom: 'Albatros' } },
        { id: 2, espece: 'Sardine', poids: 200, quantite: 500, zonePeche: 'Zone C', date: new Date(), bateau: { nom: 'Espadon' } },
      ]
      mockPrisma.capture.findMany.mock.mockImplementation(() => mockCaptures)
      mockPrisma.capture.count.mock.mockImplementation(() => 2)

      const { req, res } = mockReqRes({ query: { page: '1', limit: '10' } })
      await captureController.getCaptures(req, res, () => {})

      assert.strictEqual(res.json.mock.calls.length, 1)
      const result = res.json.mock.calls[0].arguments[0]
      assert.ok(result.captures)
      assert.equal(result.captures.length, 2)
      assert.ok(result.pagination)
      assert.equal(result.pagination.total, 2)
    })

    it('devrait filtrer par espèce', async () => {
      mockPrisma.capture.findMany.mock.mockImplementation(() => [
        { id: 1, espece: 'Thon rouge', poids: 150, quantite: 10, date: new Date(), bateau: {} },
      ])
      mockPrisma.capture.count.mock.mockImplementation(() => 1)

      const { req, res } = mockReqRes({ query: { espece: 'Thon', page: '1', limit: '10' } })
      await captureController.getCaptures(req, res, () => {})

      const result = res.json.mock.calls[0].arguments[0]
      assert.equal(result.captures.length, 1)
      assert.equal(result.captures[0].espece, 'Thon rouge')
    })

    it('devrait gérer la pagination vide', async () => {
      mockPrisma.capture.findMany.mock.mockImplementation(() => [])
      mockPrisma.capture.count.mock.mockImplementation(() => 0)

      const { req, res } = mockReqRes({ query: { page: '99', limit: '10' } })
      await captureController.getCaptures(req, res, () => {})

      const result = res.json.mock.calls[0].arguments[0]
      assert.equal(result.captures.length, 0)
      assert.equal(result.pagination.total, 0)
    })
  })

  describe('createCapture()', () => {
    it('devrait créer une capture valide', async () => {
      const mockNewCapture = {
        id: 1,
        bateauId: 1,
        userId: 1,
        espece: 'Thon rouge',
        poids: 150.5,
        quantite: 10,
        zonePeche: 'Zone A',
        profondeur: 120,
        temperature: 22.5,
        date: new Date(),
        bateau: { nom: 'Albatros' },
        user: { nom: 'Admin' },
      }
      mockPrisma.capture.create.mock.mockImplementation(() => mockNewCapture)

      const { req, res } = mockReqRes({
        body: {
          bateauId: 1,
          espece: 'Thon rouge',
          poids: 150.5,
          quantite: 10,
          zonePeche: 'Zone A',
          profondeur: 120,
          temperature: 22.5,
        },
      })
      await captureController.createCapture(req, res, () => {})

      assert.strictEqual(res.status.mock.calls[0]?.arguments[0], 201)
      const result = res.json.mock.calls[0].arguments[0]
      assert.equal(result.espece, 'Thon rouge')
      assert.equal(result.poids, 150.5)
    })
  })

  describe('getCaptureById()', () => {
    it('devrait retourner une capture existante', async () => {
      mockPrisma.capture.findUnique.mock.mockImplementation(() => ({
        id: 1,
        espece: 'Thon rouge',
        poids: 150,
        date: new Date(),
        bateau: { nom: 'Albatros' },
        user: { nom: 'Admin' },
        stocks: [],
      }))

      const { req, res } = mockReqRes({ params: { id: '1' } })
      await captureController.getCaptureById(req, res, () => {})

      assert.ok(res.json.mock.calls.length, 1)
      assert.equal(res.json.mock.calls[0].arguments[0].id, 1)
    })

    it('devrait retourner 404 si capture inexistante', async () => {
      mockPrisma.capture.findUnique.mock.mockImplementation(() => null)

      const { req, res } = mockReqRes({ params: { id: '999' } })
      await captureController.getCaptureById(req, res, () => {})

      assert.equal(res.status.mock.calls[0]?.arguments[0], 404)
    })
  })

  describe('updateCapture() / deleteCapture()', () => {
    it('devrait mettre à jour une capture', async () => {
      mockPrisma.capture.update.mock.mockImplementation(({ data }) => ({
        id: 1,
        ...data,
        date: new Date(),
        bateau: {},
        user: {},
      }))

      const { req, res } = mockReqRes({
        params: { id: '1' },
        body: { poids: 200, quantite: 15 },
      })
      await captureController.updateCapture(req, res, () => {})

      assert.ok(res.json.mock.calls.length, 1)
      assert.equal(res.json.mock.calls[0].arguments[0].poids, 200)
    })

    it('devrait supprimer une capture', async () => {
      mockPrisma.capture.delete.mock.mockImplementation(() => ({}))

      const { req, res } = mockReqRes({ params: { id: '1' } })
      await captureController.deleteCapture(req, res, () => {})

      assert.equal(res.status.mock.calls[0]?.arguments[0], 204)
    })
  })

  describe('importCapturesCSV()', () => {
    it("devrait importer un tableau de captures", async () => {
      mockPrisma.capture.create.mock.mockImplementation(({ data }) => ({ id: Math.random(), ...data }))

      const { req, res } = mockReqRes({
        body: {
          captures: [
            { bateauId: 1, espece: 'Sardine', poids: 200, quantite: 500, zonePeche: 'Zone C' },
            { bateauId: 2, espece: 'Maquereau', poids: 150, quantite: 300, zonePeche: 'Zone A' },
          ],
        },
      })
      await captureController.importCapturesCSV(req, res, () => {})

      const result = res.json.mock.calls[0].arguments[0]
      assert.equal(result.success, 2)
      assert.equal(result.errors, 0)
    })

    it('devrait signaler les erreurs de validation', async () => {
      const { req, res } = mockReqRes({
        body: {
          captures: [
            { bateauId: 1, espece: 'Sardine', poids: 200, quantite: 500 },
            { poids: 150, quantite: 300 }, // manque espece et bateauId
          ],
        },
      })
      mockPrisma.capture.create.mock.mockImplementation(({ data }) => ({ id: 1, ...data }))

      await captureController.importCapturesCSV(req, res, () => {})

      const result = res.json.mock.calls[0].arguments[0]
      assert.equal(result.success, 1)
      assert.equal(result.errors, 1)
    })
  })

  describe('getCapturesStats()', () => {
    it('devrait retourner les statistiques 30 jours', async () => {
      const date30jAgo = new Date()
      date30jAgo.setDate(date30jAgo.getDate() - 30)

      mockPrisma.capture.findMany.mock.mockImplementation(({ where }) => {
        if (where?.date?.gte) return [
          { date: new Date(), espece: 'Thon', poids: 150, quantite: 10 },
          { date: new Date(), espece: 'Sardine', poids: 200, quantite: 500 },
        ]
        return []
      })
      mockPrisma.bateau.count.mock.mockImplementation(() => 3)
      mockPrisma.stock.findMany.mock.mockImplementation(() => [
        { quantite: 500, espece: 'Thon', unite: 'kg', seuil: 50, alerte: false },
      ])
      mockPrisma.anomalie.count.mock.mockImplementation(() => 2)

      const { req, res } = mockReqRes()
      await captureController.getCapturesStats(req, res, () => {})

      const result = res.json.mock.calls[0].arguments[0]
      assert.ok(result.totalCaptures30j)
      assert.ok(result.totalPoids30j)
      assert.ok(result.totalBateaux)
      assert.ok(result.capturesParJour)
      assert.ok(result.repartitionEspece)
      assert.equal(result.totalBateaux, 3)
    })
  })
})
