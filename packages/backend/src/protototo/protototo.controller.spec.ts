import { Test, TestingModule } from '@nestjs/testing';
import { ProtototoController } from './protototo.controller';
import { ProtototoService } from './protototo.service';

describe('ProtototoController', () => {
  let controller: ProtototoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProtototoController],
      providers: [ProtototoService],
    }).compile();

    controller = module.get<ProtototoController>(ProtototoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
