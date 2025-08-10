export const prismaMock = {
  url: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  click: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
};
