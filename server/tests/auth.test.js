const { describe, it, before, after, mock } = require('node:test')
const assert = require('node:assert')

// Mock Prisma + bcrypt + jwt
const mockPrisma = {
  user: {
    findUnique: mock.fn(),
    create: mock.fn(),
  },
}

const mockBcrypt = {
  hash: mock.fn(),
  compare: mock.fn(),
}

const mockJwt = {
  sign: mock.fn(),
}

// Remplacement des dépendances
mock.module('../src/config/database', { default: mockPrisma, namedExports: true })
mock.module('bcryptjs', { default: mockBcrypt, namedExports: true })
mock.module('jsonwebtoken', { default: mockJwt, namedExports: true })

const authService = require('../src/services/authService')

describe('🔐 Service Auth', () => {
  before(() => {
    process.env.JWT_SECRET = 'test-secret'
  })

  after(() => {
    mock.reset()
  })

  describe('register()', () => {
    it('devrait créer un utilisateur avec email unique', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(() => null)
      mockBcrypt.hash.mock.mockImplementation(() => 'hashed-password')
      mockJwt.sign.mock.mockImplementation(() => 'mock-jwt-token')
      mockPrisma.user.create.mock.mockImplementation(({ data }) => ({
        id: 1,
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
        createdAt: new Date(),
      }))

      const result = await authService.register({
        email: 'test@test.com',
        password: 'password123',
        nom: 'Test',
        prenom: 'User',
        role: 'OBSERVATEUR',
      })

      assert.ok(result.user)
      assert.equal(result.user.email, 'test@test.com')
      assert.equal(result.user.role, 'OBSERVATEUR')
      assert.ok(result.token)
      assert.equal(result.token, 'mock-jwt-token')
    })

    it('devrait rejeter un email déjà existant', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(() => ({
        id: 1,
        email: 'existing@test.com',
      }))

      await assert.rejects(
        () => authService.register({
          email: 'existing@test.com',
          password: 'password123',
          nom: 'Test',
          prenom: 'User',
        }),
        { message: 'Un utilisateur avec cet email existe déjà' }
      )
    })
  })

  describe('login()', () => {
    it('devrait connecter un utilisateur avec les bons identifiants', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'hashed-password',
        nom: 'Test',
        prenom: 'User',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mock.mockImplementation(() => mockUser)
      mockBcrypt.compare.mock.mockImplementation(() => true)
      mockJwt.sign.mock.mockImplementation(() => 'mock-login-token')

      const result = await authService.login('test@test.com', 'password123')

      assert.ok(result.user)
      assert.equal(result.user.email, 'test@test.com')
      assert.equal(result.user.role, 'ADMIN')
      assert.ok(result.token)
      assert.equal(result.token, 'mock-login-token')
      // Le mot de passe ne doit pas être retourné
      assert.equal(result.user.password, undefined)
    })

    it('devrait rejeter un email inexistant', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(() => null)

      await assert.rejects(
        () => authService.login('unknown@test.com', 'password123'),
        { message: 'Email ou mot de passe incorrect' }
      )
    })

    it('devrait rejeter un mauvais mot de passe', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(() => ({
        id: 1,
        email: 'test@test.com',
        password: 'hashed-password',
      }))
      mockBcrypt.compare.mock.mockImplementation(() => false)

      await assert.rejects(
        () => authService.login('test@test.com', 'wrong-password'),
        { message: 'Email ou mot de passe incorrect' }
      )
    })
  })

  describe('getMe()', () => {
    it('devrait retourner le profil utilisateur', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(({ where }) => ({
        id: where.id,
        email: 'test@test.com',
        nom: 'Test',
        prenom: 'User',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      const user = await authService.getMe(1)

      assert.ok(user)
      assert.equal(user.email, 'test@test.com')
      assert.equal(user.role, 'ADMIN')
    })

    it('devrait rejeter un utilisateur inexistant', async () => {
      mockPrisma.user.findUnique.mock.mockImplementation(() => null)

      await assert.rejects(
        () => authService.getMe(999),
        { message: 'Utilisateur non trouvé' }
      )
    })
  })
})
