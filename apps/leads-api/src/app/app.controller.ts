import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AppService } from './app.service';
import { LeadResponseDto, ProbeResultDto } from './dto/lead.dto';
import { SamApiService } from './services/sam-api.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly samApiService: SamApiService
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  async getHealth() {
    return this.appService.getHealthStatus();
  }

  @Get('pack')
  async packLeads(@Query('mode') mode?: string): Promise<{
    leads: LeadResponseDto[];
    scriptOutput: string;
  }> {
    try {
      return await this.appService.packLeads(mode);
    } catch (error) {
      console.error('Error in packLeads:', error);
      return {
        leads: [],
        scriptOutput: `Error packing leads: ${error?.toString()}`,
      };
    }
  }  @Get('sam/test-live')
  async testLiveSam() {
    return this.appService.testLiveSamApi();
  }

  @Get('sam/nd-it')
  async searchNdIt() {
    try {
      return await this.appService.searchNdItContracts();
    } catch (error) {
      console.error('Error in searchNdIt:', error);
      return {
        success: false,
  message: `Error searching ND IT contracts: ${error?.toString()}`,
        contractsFound: 0,
        contracts: [],
        timestamp: new Date(),
      };
    }
  }

  @Post('probe')
  async probeSam(@Body() body: { leadId: string }): Promise<ProbeResultDto> {
    return await firstValueFrom(this.appService.probeSam(body.leadId));
  }

  @Post('probe/verbose')
  async probeSamVerbose(
    @Body() body: { leadId: string }
  ): Promise<ProbeResultDto> {
    return await firstValueFrom(this.appService.probeSamVerbose(body.leadId));
  }

  @Post('search')
  async searchSam(
    @Body() body: { term: string; naicsCode?: string }
  ): Promise<{ results: string[]; total: number; leads: LeadResponseDto[] }> {
    return this.appService.searchSam(body.term, body.naicsCode);
  }

  @Post('search-sam-gov')
  async searchSamGov(
    @Body() body: { naicsCode?: string; maxValue?: number; limit?: number }
  ): Promise<{ success: boolean; message: string; contractsFound: number; contracts: Record<string, unknown>[]; timestamp: Date }> {
    try {
      const contracts = await this.samApiService.searchContracts({
        naicsCode: body.naicsCode,
        maxValue: body.maxValue || 250000,
        setAside: 'SBA',
        limit: body.limit || 10,
      });

      console.log(`🔍 SAM.gov Search Results: Found ${contracts.length} contracts`);
      if (contracts.length > 0) {
        console.log('📋 Contract Details:');
        contracts.forEach((contract, index) => {
          console.log(`${index + 1}. ${contract.title || 'No Title'}`);
          console.log(`   Notice ID: ${contract.noticeId || 'N/A'}`);
          console.log(`   NAICS: ${contract.naicsCode || 'N/A'}`);
          console.log(`   Value: $${contract.baseAndAllOptionsValue || 'N/A'}`);
          console.log(`   Agency: ${contract.fullParentPathName || 'N/A'}`);
          console.log(`   Posted: ${contract.postedDate || 'N/A'}`);
          console.log('---');
        });
      } else {
        console.log('❌ No contracts found matching the criteria');
      }

      return {
        success: true,
        message: `Found ${contracts.length} contracts from SAM.gov`,
        contractsFound: contracts.length,
        contracts: contracts,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ SAM.gov search failed:', error);
      return {
        success: false,
        message: `SAM.gov search failed: ${error?.toString()}`,
        contractsFound: 0,
        contracts: [],
        timestamp: new Date(),
      };
    }
  }
}
