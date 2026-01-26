import { Test } from '@nestjs/testing';
import { AppService } from './app.service';
import { LeadsService } from './services/leads.service';
import { SamApiService } from './services/sam-api.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { of } from 'rxjs';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: LeadsService,
          useValue: {
            getLeads: jest.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: SamApiService,
          useValue: {
            searchContracts: jest.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: getConnectionToken(),
          useValue: {
            readyState: 1,
          },
        },
      ],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "SAM Leads API - Connected to in-memory MongoDB"', (done) => {
      service.getData().subscribe(result => {
        expect(result).toEqual({ message: 'SAM Leads API - Connected to in-memory MongoDB' });
        done();
      });
    });
  });
});
