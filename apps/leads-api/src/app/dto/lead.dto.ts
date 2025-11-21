export class CreateLeadDto {
  leadId!: string;
  companyName!: string;
  naicsCode!: string;
  naicsDescription?: string;
  ueiSAM?: string;
  cageCode?: string;
  duns?: string;
  addressLine1?: string;
  city?: string;
  stateCode?: string;
  zipCode?: string;
  congressionalDistrict?: string;
  businessType?: string[];
  sbaBusinessTypeDesc?: string[];
  registrationDate?: Date;
  expirationDate?: Date;
  registrationStatus?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  website?: string;
}

export class LeadResponseDto {
  leadId!: string;
  companyName!: string;
  naicsCode!: string;
  naicsDescription?: string;
  city?: string;
  stateCode?: string;
  businessType?: string[];
  registrationStatus?: string;
  probeStatus?: string;
  lastProbed?: Date;
  contracts?: {
    contractNumber: string;
    title: string;
    description?: string;
    value: number;
    awardDate: Date;
    status: string;
    isSample?: boolean;
    isTest?: boolean;
  }[];
}

export class ProbeResultDto {
  leadId!: string;
  companyName!: string;
  result!: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  probeData?: Record<string, any>;
  timestamp!: Date;
}

export class SearchResultDto {
  total!: number;
  leads!: LeadResponseDto[];
}
