import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('should be defined', async () => {
    // Basic smoke test - full integration tests require DB
    expect(AppModule).toBeDefined();
  });
});
