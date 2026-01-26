import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppService, SamContract, HealthStatus, SamApiTestResult, NdItSearchResult } from './app.service';
import { LeadResponseDto, ProbeResultDto } from './dto/lead.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData(): Observable<{ message: string }> {
    return this.appService.getData();
  }

  @Get('health')
  getHealth(): Observable<HealthStatus> {
    return this.appService.getHealthStatus();
  }

  @Get('pack')
  packLeads(
    @Query('mode') mode?: string
  ): Observable<{ leads: LeadResponseDto[]; scriptOutput: string }> {
    return this.appService.packLeads(mode).pipe(
      catchError((error: Error) => {
        console.error('Error in packLeads:', error);
        return of({
          leads: [],
          scriptOutput: `Error packing leads: ${error?.toString()}`,
        });
      })
    );
  }

  @Get('sam/test-live')
  testLiveSam(): Observable<SamApiTestResult> {
    return this.appService.testLiveSamApi();
  }

  @Get('sam/nd-it')
  searchNdIt(): Observable<NdItSearchResult> {
    return this.appService.searchNdItContracts().pipe(
      catchError((error: Error) => {
        console.error('Error in searchNdIt:', error);
        return of({
          success: false,
          message: `Error searching ND IT contracts: ${error?.toString()}`,
          contractsFound: 0,
          contracts: [],
          naicsCodesSearched: [],
          timestamp: new Date(),
        });
      })
    );
  }

  @Post('probe')
  probeSam(@Body() body: { leadId: string }): Observable<ProbeResultDto> {
    return this.appService.probeSam(body.leadId);
  }

  @Post('probe/verbose')
  probeSamVerbose(
    @Body() body: { leadId: string }
  ): Observable<ProbeResultDto> {
    return this.appService.probeSamVerbose(body.leadId);
  }

  @Post('search')
  searchSam(
    @Body() body: { term: string; naicsCode?: string }
  ): Observable<{ results: string[]; total: number; leads: LeadResponseDto[] }> {
    return this.appService.searchSam(body.term, body.naicsCode);
  }

  @Post('search-sam-gov')
  searchSamGov(
    @Body() body: { naicsCode?: string; maxValue?: number; limit?: number }
  ): Observable<{
    success: boolean;
    message: string;
    contractsFound: number;
    contracts: SamContract[];
    timestamp: Date;
  }> {
    return this.appService.searchSamGov({
      naicsCode: body.naicsCode,
      maxValue: body.maxValue,
      limit: body.limit,
    });
  }
}
