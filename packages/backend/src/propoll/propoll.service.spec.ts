import { Test, TestingModule } from '@nestjs/testing';
import { PropollService } from './propoll.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Propoll } from './entities/propoll.entity';
import { PropollOption } from './entities/propoll-option.entity';
import { PropollVote } from './entities/propoll-vote.entity';

describe('PropollService', () => {
  let service: PropollService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropollService,
        { provide: getRepositoryToken(Propoll), useValue: {} },
        { provide: getRepositoryToken(PropollOption), useValue: {} },
        { provide: getRepositoryToken(PropollVote), useValue: { manager: {} } },
      ],
    }).compile();

    service = module.get<PropollService>(PropollService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
