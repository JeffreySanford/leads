import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead } from '../schemas/lead.schema';
import {
  LeadResponseDto,
  ProbeResultDto,
  SearchResultDto,
} from '../dto/lead.dto';
import { seedLeads } from '../seed-data/leads.seed';

@Injectable()
export class LeadsService implements OnModuleInit {
  constructor(@InjectModel(Lead.name) private leadModel: Model<Lead>) {}

  async onModuleInit() {
    const count = await this.leadModel.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding database with North Dakota SAM.gov leads...');
      await this.leadModel.insertMany(seedLeads);
      console.log(`✅ Seeded ${seedLeads.length} leads`);
    }
  }

  async packLeads(): Promise<LeadResponseDto[]> {
    const leads = await this.leadModel
      .find()
      .select(
        'leadId companyName naicsCode naicsDescription city stateCode businessType registrationStatus probeStatus lastProbed contracts'
      );
    return leads.map((lead) => this.toResponseDto(lead));
  }

  async probeSam(leadId: string): Promise<ProbeResultDto> {
    const lead = await this.leadModel.findOne({ leadId });

    if (!lead) {
      return {
        leadId,
        companyName: 'Unknown',
        result: `Lead ${leadId} not found in database`,
        timestamp: new Date(),
      };
    }

    // Update probe status
    lead.probeStatus = 'probed';
    lead.lastProbed = new Date();
    await lead.save();

    return {
      leadId: lead.leadId,
      companyName: lead.companyName,
      result: `Company: ${lead.companyName}\nNAICS: ${lead.naicsCode} - ${
        lead.naicsDescription
      }\nLocation: ${lead.city}, ${lead.stateCode}\nStatus: ${
        lead.registrationStatus
      }\nBusiness Types: ${lead.sbaBusinessTypeDesc?.join(', ')}`,
      probeData: {
        ueiSAM: lead.ueiSAM,
        cageCode: lead.cageCode,
        address: lead.addressLine1,
        contact: {
          name: lead.primaryContactName,
          email: lead.primaryContactEmail,
          phone: lead.primaryContactPhone,
        },
        website: lead.website,
      },
      timestamp: new Date(),
    };
  }

  async probeSamVerbose(leadId: string): Promise<ProbeResultDto> {
    const lead = await this.leadModel.findOne({ leadId });

    if (!lead) {
      return {
        leadId,
        companyName: 'Unknown',
        result: `Lead ${leadId} not found in database`,
        timestamp: new Date(),
      };
    }

    // Update probe status
    lead.probeStatus = 'probed-verbose';
    lead.lastProbed = new Date();
    await lead.save();

    const verboseResult = `
=== SAM.gov Entity Details ===
Lead ID: ${lead.leadId}
Company Name: ${lead.companyName}
UEI SAM: ${lead.ueiSAM}
CAGE Code: ${lead.cageCode}
DUNS: ${lead.duns}

=== NAICS Information ===
Primary NAICS: ${lead.naicsCode}
Description: ${lead.naicsDescription}

=== Location ===
Address: ${lead.addressLine1}
City: ${lead.city}, ${lead.stateCode} ${lead.zipCode}
Congressional District: ${lead.congressionalDistrict}

=== Registration ===
Status: ${lead.registrationStatus}
Registration Date: ${lead.registrationDate?.toLocaleDateString()}
Expiration Date: ${lead.expirationDate?.toLocaleDateString()}

=== Business Classifications ===
Business Types: ${lead.businessType?.join(', ')}
SBA Certifications: ${lead.sbaBusinessTypeDesc?.join(', ')}

=== Contact Information ===
Primary Contact: ${lead.primaryContactName}
Email: ${lead.primaryContactEmail}
Phone: ${lead.primaryContactPhone}
Website: ${lead.website}

=== Probe History ===
Last Probed: ${lead.lastProbed?.toLocaleString()}
Probe Status: ${lead.probeStatus}
    `.trim();

    return {
      leadId: lead.leadId,
      companyName: lead.companyName,
      result: verboseResult,
      probeData: lead.toObject(),
      timestamp: new Date(),
    };
  }

  async searchSam(term: string): Promise<SearchResultDto> {
    const regex = new RegExp(term, 'i');
    const leads = await this.leadModel
      .find({
        $or: [
          { companyName: regex },
          { naicsCode: regex },
          { naicsDescription: regex },
          { city: regex },
          { stateCode: regex },
        ],
      })
      .select(
        'leadId companyName naicsCode naicsDescription city stateCode businessType registrationStatus probeStatus lastProbed contracts'
      );

    return {
      total: leads.length,
      leads: leads.map((lead) => this.toResponseDto(lead)),
    };
  }

  private toResponseDto(lead: Lead): LeadResponseDto {
    return {
      leadId: lead.leadId,
      companyName: lead.companyName,
      naicsCode: lead.naicsCode,
      naicsDescription: lead.naicsDescription,
      city: lead.city,
      stateCode: lead.stateCode,
      businessType: lead.businessType,
      registrationStatus: lead.registrationStatus,
      probeStatus: lead.probeStatus,
      lastProbed: lead.lastProbed,
      contracts: lead.contracts,
    };
  }
}
