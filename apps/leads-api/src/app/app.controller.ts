import { Controller, Get, Post, Body } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AppService } from './app.service';
import { LeadResponseDto, ProbeResultDto } from './dto/lead.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  async getHealth() {
    return this.appService.getHealthStatus();
  }

  @Get('pack')
  async packLeads(): Promise<{
    leads: LeadResponseDto[];
    scriptOutput: string;
  }> {
    try {
      return await this.appService.packLeads();
    } catch (error) {
      console.error('Error in packLeads:', error);
      return {
        leads: [],
  scriptOutput: `Error packing leads: ${error?.toString()}`,
      };
    }
  }

  @Get('sam/test-live')
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
    @Body() body: { term: string }
  ): Promise<{ results: string[]; total: number; leads: LeadResponseDto[] }> {
    return this.appService.searchSam(body.term);
  }
}
