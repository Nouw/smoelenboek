import { Test, TestingModule } from '@nestjs/testing';
import { NevoboController } from './nevobo.controller';
import { NevoboService } from './nevobo.service';

describe('NevoboController', () => {
  let controller: NevoboController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NevoboController],
      providers: [NevoboService],
    }).compile();

    controller = module.get<NevoboController>(NevoboController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
