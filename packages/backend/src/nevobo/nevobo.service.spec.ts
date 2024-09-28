import { Test, TestingModule } from '@nestjs/testing';
import { NevoboService } from './nevobo.service';

describe('NevoboService', () => {
  let service: NevoboService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NevoboService],
    }).compile();

    service = module.get<NevoboService>(NevoboService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
