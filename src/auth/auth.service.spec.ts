import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

// Mock tipado do bcrypt para evitar "never"
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const prisma = require('../../test/mocks/prisma.mock').prismaMock;
  const jwtService = { sign: jest.fn().mockReturnValue('token123') } as any;

  let service: AuthService;
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as any, jwtService);
  });

  it('register cria usuário e retorna token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: 'hashed' });

    mockedBcrypt.hash.mockResolvedValue('hashed');

    const res = await service.register({ email: 'a@b.com', password: '123456' } as any);
    expect(res.token).toBe('token123');
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('123456', expect.any(Number));
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('login ok', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: 'hashed' });

    mockedBcrypt.compare.mockResolvedValue(true);

    const res = await service.login('a@b.com', '123456');
    expect(res.token).toBe('token123');
    expect(mockedBcrypt.compare).toHaveBeenCalledWith('123456', 'hashed');
  });
});
