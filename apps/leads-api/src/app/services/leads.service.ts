import { liveSeedLeads } from '../seed-data/live-seed';
import { seedLeads } from '../seed-data/leads.seed';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead } from '../schemas/lead.schema';
import { LeadResponseDto, ProbeResultDto, SearchResultDto } from '../dto/lead.dto';
import { Observable, from, of } from 'rxjs';
import { switchMap, map, mergeMap, toArray } from 'rxjs/operators';

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
    
    return from(liveSeedLeads as LeadResponseDto[]).pipe(
      mergeMap((lead: LeadResponseDto) => {
        if (!('leadId' in lead)) return of(null);
        return from(this.leadModel.exists({ leadId: lead.leadId })).pipe(
          switchMap((exists) => {
            if (!exists) {
              return from(this.leadModel.create(lead)).pipe(map(() => 1));
            }
            return of(0);
          })
        );
      }),
      toArray(),
      map((results) => {
        const imported = results.reduce((acc, val) => acc + (val || 0), 0);
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
  ).pipe(map((leads) => (leads as unknown as Record<string, unknown>[]).map((lead) => this.toResponseDto(lead))));
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

  searchSam(term: string, naicsCode?: string): Observable<SearchResultDto> {
    const termRegex = term ? new RegExp(term, 'i') : null;
    const naicsRegex = naicsCode ? new RegExp(naicsCode.replace(/\s*,\s*/g, '|'), 'i') : null;

    const query: Record<string, unknown> = {};

    // Build query conditions
    const orConditions: Record<string, unknown>[] = [];

    if (termRegex) {
      orConditions.push(
        { companyName: termRegex },
        { naicsDescription: termRegex },
        { city: termRegex },
        { stateCode: termRegex }
      );
    }

    if (naicsRegex) {
      orConditions.push({ naicsCode: naicsRegex });
    }

    // If no search criteria, return empty result
    if (orConditions.length === 0) {
      return of({ total: 0, leads: [] });
    }

    query['$or'] = orConditions;

    return from(
      this.leadModel
        .find(query)
        .select(
          'leadId companyName naicsCode naicsDescription city stateCode businessType registrationStatus probeStatus lastProbed contracts'
        )
        .lean()
    ).pipe(
      map((leads) => ({
        total: (leads as unknown as Record<string, unknown>[]).length,
        leads: (leads as unknown as Record<string, unknown>[]).map((lead) => this.toResponseDto(lead)),
      }))
    );
  }

  saveLeadIfNotExists(leadDto: LeadResponseDto): Observable<void> {
    return from(this.leadModel.exists({ leadId: leadDto.leadId })).pipe(
      switchMap((exists) => {
        if (!exists) {
          return from(this.leadModel.create(leadDto)).pipe(map(() => undefined));
        }
        return of(undefined);
      })
    );
  }

  private toResponseDto(lead: Record<string, unknown>): LeadResponseDto {
    return {
      leadId: lead['leadId'] as string,
      companyName: lead['companyName'] as string,
      naicsCode: lead['naicsCode'] as string,
      naicsDescription: lead['naicsDescription'] as string,
      city: lead['city'] as string,
      stateCode: lead['stateCode'] as string,
      businessType: lead['businessType'] as string[],
      registrationStatus: lead['registrationStatus'] as string,
      probeStatus: lead['probeStatus'] as string,
      lastProbed: lead['lastProbed'] as Date,
      contracts: lead['contracts'] as LeadResponseDto['contracts'],
    };
  }
}
