import { Test, TestingModule } from '@nestjs/testing';
import { PropollController } from './propoll.controller';
import { PropollService } from './propoll.service';

describe('PropollController', () => {
  let controller: PropollController;
  const propollService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    vote: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropollController],
      providers: [
        {
          provide: PropollService,
          useValue: propollService,
        },
      ],
    }).compile();

    controller = module.get<PropollController>(PropollController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
