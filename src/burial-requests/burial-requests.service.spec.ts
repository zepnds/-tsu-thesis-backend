import { Test, TestingModule } from '@nestjs/testing';
import { BurialRequestsService } from './burial-requests.service';

describe('BurialRequestsService', () => {
  let service: BurialRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BurialRequestsService],
    }).compile();

    service = module.get<BurialRequestsService>(BurialRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
