import { Test, TestingModule } from '@nestjs/testing';
import { GravesService } from './graves.service';

describe('GravesService', () => {
  let service: GravesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GravesService],
    }).compile();

    service = module.get<GravesService>(GravesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
