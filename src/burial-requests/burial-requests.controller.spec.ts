import { Test, TestingModule } from '@nestjs/testing';
import { BurialRequestsController } from './burial-requests.controller';

describe('BurialRequestsController', () => {
  let controller: BurialRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BurialRequestsController],
    }).compile();

    controller = module.get<BurialRequestsController>(BurialRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
