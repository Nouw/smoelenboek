import { type INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let app: INestApplication;
  let query: jest.Mock;

  beforeEach(async () => {
    query = jest.fn().mockResolvedValue([{ result: 1 }]);
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DataSource, useValue: { query } }],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('returns a non-cacheable healthy response when the database is reachable', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/health')
      .expect(200);

    expect(query).toHaveBeenCalledWith('SELECT 1');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({
      checks: { database: { status: 'up' } },
      service: 'smoelenboek-rpc',
      status: 'ok',
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  it('returns 503 and a stable response shape when the database is unavailable', async () => {
    query.mockRejectedValueOnce(new Error('connection refused'));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const response = await request(app.getHttpServer() as Server)
      .get('/health')
      .expect(503);

    expect(response.body).toEqual({
      checks: { database: { status: 'down' } },
      service: 'smoelenboek-rpc',
      status: 'error',
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });
});
