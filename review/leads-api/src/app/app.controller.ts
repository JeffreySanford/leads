import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

interface Lead {
  lead_id: number;
  company: string;
  naics_code: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('pack')
  packLeads(): { leads: Lead[] } {
    return this.appService.packLeads();
  }

  @Post('probe')
  probeSam(@Body() body: { leadId: string }) {
    return this.appService.probeSam(body.leadId);
  }

  @Post('probe/verbose')
  probeSamVerbose(@Body() body: { leadId: string }) {
    return this.appService.probeSamVerbose(body.leadId);
  }

  @Post('search')
  searchSam(@Body() body: { term: string }) {
    return this.appService.searchSam(body.term);
  }
}
