import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SamApiService } from './services/sam-api.service';
import { of } from 'rxjs';

describe('AppController', () => {
  let appController: AppController;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getData: jest.fn().mockReturnValue(of({ message: 'SAM Leads API - Connected to in-memory MongoDB' })),
            getHealthStatus: jest.fn().mockReturnValue(of({ status: 'ok' })),
          },
        },
        {
          provide: SamApiService,
          useValue: {
            searchContracts: jest.fn().mockReturnValue(of([])),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getData', () => {
    it('should return the welcome message', (done) => {
      appController.getData().subscribe(result => {
        expect(result).toEqual({ message: 'SAM Leads API - Connected to in-memory MongoDB' });
        done();
      });
    });
  });

  describe('getHealth', () => {
    it('should return health status', (done) => {
      appController.getHealth().subscribe(res => {
        expect(res).toEqual({ status: 'ok' });
        done();
      });
    });
  });
});
