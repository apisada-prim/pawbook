import { Test, TestingModule } from '@nestjs/testing';
import { VaccinesResolver } from './vaccines.resolver';

describe('VaccinesResolver', () => {
  let resolver: VaccinesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VaccinesResolver],
    }).compile();

    resolver = module.get<VaccinesResolver>(VaccinesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
