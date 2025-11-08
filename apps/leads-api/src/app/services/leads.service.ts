import { liveSeedLeads } from '../seed-data/live-seed';
import { seedLeads } from '../seed-data/leads.seed';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead } from '../schemas/lead.schema';
import { LeadResponseDto, ProbeResultDto, SearchResultDto } from '../dto/lead.dto';
import { Observable, from, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

// ...existing code...

@Injectable()
export class LeadsService implements OnModuleInit {
  constructor(@InjectModel(Lead.name) private leadModel: Model<Lead>) {}

  onModuleInit(): void {
    from(this.leadModel.countDocuments()).pipe(
      switchMap((count) => {
        if (count === 0) {
          console.log('🌱 Seeding database with North Dakota SAM.gov leads...');
          return from(this.leadModel.insertMany(seedLeads)).pipe(
            map(() => {
              console.log(`✅ Seeded ${seedLeads.length} leads`);
            })
          );
        }
        return of(undefined);
      })
    ).subscribe();
  }

  importLiveSeedLeads(): Observable<number> {
    if (!liveSeedLeads || liveSeedLeads.length === 0) return of(0);
    let imported = 0;
    return from(Promise.all(
      (liveSeedLeads as LeadResponseDto[]).map(async (lead: LeadResponseDto) => {
        if (!('leadId' in lead)) return;
        const exists = await this.leadModel.exists({ leadId: lead.leadId });
        if (!exists) {
          await this.leadModel.create(lead);
          imported++;
        }
      })
    )).pipe(
      map(() => {
        console.log(`✅ Imported ${imported} live leads from live-seed.ts`);
        return imported;
      })
    );
  }

  packLeads(): Observable<LeadResponseDto[]> {
    return from(
      this.leadModel
        .find()
        .select(
          'leadId companyName naicsCode naicsDescription city stateCode businessType registrationStatus probeStatus lastProbed contracts'
        )
        .lean()
  ).pipe(map((leads) => (leads as Lead[]).map((lead) => this.toResponseDto(lead))));
  }

  probeSam(leadId: string): Observable<ProbeResultDto> {
    return from(this.leadModel.findOne({ leadId })).pipe(
      switchMap((lead) => {
        if (!lead) {
          return of({
            leadId,
            companyName: 'Unknown',
            result: `Lead ${leadId} not found in database`,
            timestamp: new Date(),
          });
        }
        lead.probeStatus = 'probed';
        lead.lastProbed = new Date();
        return from(lead.save()).pipe(
          map(() => ({
            leadId: lead.leadId,
            companyName: lead.companyName,
            result: `Company: ${lead.companyName}\nNAICS: ${lead.naicsCode} - ${lead.naicsDescription}\nLocation: ${lead.city}, ${lead.stateCode}\nStatus: ${lead.registrationStatus}\nBusiness Types: ${lead.sbaBusinessTypeDesc?.join(', ')}`,
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
          }))
        );
      })
    );
  }

  probeSamVerbose(leadId: string): Observable<ProbeResultDto> {
    return from(this.leadModel.findOne({ leadId })).pipe(
      switchMap((lead) => {
        if (!lead) {
          return of({
            leadId,
            companyName: 'Unknown',
            result: `Lead ${leadId} not found in database`,
            timestamp: new Date(),
          });
        }
        lead.probeStatus = 'probed-verbose';
        lead.lastProbed = new Date();
        return from(lead.save()).pipe(
          map(() => {
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
          })
        );
      })
    );
  }

  searchSam(term: string): Observable<SearchResultDto> {
    const regex = new RegExp(term, 'i');
    return from(
      this.leadModel
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
        )
        .lean()
    ).pipe(
      map((leads) => ({
        total: (leads as Lead[]).length,
        leads: (leads as Lead[]).map((lead) => this.toResponseDto(lead)),
      }))
    );
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
