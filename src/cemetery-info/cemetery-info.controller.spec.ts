import { Test, TestingModule } from '@nestjs/testing';
import { CemeteryInfoController } from './cemetery-info.controller';

describe('CemeteryInfoController', () => {
  let controller: CemeteryInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CemeteryInfoController],
    }).compile();

    controller = module.get<CemeteryInfoController>(CemeteryInfoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
