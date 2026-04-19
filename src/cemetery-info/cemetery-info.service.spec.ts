import { Test, TestingModule } from '@nestjs/testing';
import { CemeteryInfoService } from './cemetery-info.service';

describe('CemeteryInfoService', () => {
  let service: CemeteryInfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CemeteryInfoService],
    }).compile();

    service = module.get<CemeteryInfoService>(CemeteryInfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
