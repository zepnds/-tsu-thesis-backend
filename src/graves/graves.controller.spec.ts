import { Test, TestingModule } from '@nestjs/testing';
import { GravesController } from './graves.controller';

describe('GravesController', () => {
  let controller: GravesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GravesController],
    }).compile();

    controller = module.get<GravesController>(GravesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
