import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { LeadResponseDto, ProbeResultDto } from './dto/lead.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('pack')
  async packLeads(): Promise<{
    leads: LeadResponseDto[];
    scriptOutput: string;
  }> {
    return this.appService.packLeads();
  }

  @Get('sam/test-live')
  async testLiveSam() {
    return this.appService.testLiveSamApi();
  }

  @Get('sam/nd-it')
  async searchNdIt() {
    return this.appService.searchNdItContracts();
  }

  @Post('probe')
  async probeSam(@Body() body: { leadId: string }): Promise<ProbeResultDto> {
    return this.appService.probeSam(body.leadId);
  }

  @Post('probe/verbose')
  async probeSamVerbose(
    @Body() body: { leadId: string }
  ): Promise<ProbeResultDto> {
    return this.appService.probeSamVerbose(body.leadId);
  }

  @Post('search')
  async searchSam(
    @Body() body: { term: string }
  ): Promise<{ results: string[]; total: number; leads: LeadResponseDto[] }> {
    return this.appService.searchSam(body.term);
  }
}
