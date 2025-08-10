import { UrlsService } from './urls.service';

describe('UrlsService', () => {
  const prisma = (global as any).prismaMock || require('../../test/mocks/prisma.mock').prismaMock;
  let service: UrlsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UrlsService(prisma as any);
    process.env.APP_DOMAIN = 'http://localhost:3000';
  });

  it('cria short url (anon)', async () => {
    prisma.url.create.mockResolvedValue({
      id: 'u1',
      code: 'Ab1cD2',
      original: 'https://google.com',
      userId: null,
      clickCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const res = await service.createShort({ originalUrl: 'https://google.com' }, null);
    expect(res.shortUrl).toMatch(/http:\/\/localhost:3000\/[A-Za-z0-9]{6}/);
    expect(prisma.url.create).toHaveBeenCalled();
  });

  it('findByCode ignora soft-deleted', async () => {
    prisma.url.findFirst.mockResolvedValue(null);
    const res = await service.findByCode('Ab1cD2');
    expect(res).toBeNull();
  });

  it('registerClick cria click e incrementa contador', async () => {
    prisma.click.create.mockResolvedValue({ id: 'c1' });
    prisma.url.update.mockResolvedValue({});
    await service.registerClick('u1', { ip: '127.0.0.1', userAgent: 'jest' });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
