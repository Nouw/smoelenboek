import { Test, TestingModule } from '@nestjs/testing';
import { ProtototoService } from './protototo.service';

describe('ProtototoService', () => {
  let service: ProtototoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProtototoService],
    }).compile();

    service = module.get<ProtototoService>(ProtototoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
