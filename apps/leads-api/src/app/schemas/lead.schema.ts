import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LeadDocument = HydratedDocument<Lead>;

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true, unique: true })
  leadId!: string;

  @Prop({ required: true })
  companyName!: string;

  @Prop({ required: true })
  naicsCode!: string;

  @Prop()
  naicsDescription?: string;

  @Prop()
  ueiSAM?: string;

  @Prop()
  cageCode?: string;

  @Prop()
  duns?: string;

  @Prop()
  addressLine1?: string;

  @Prop()
  city?: string;

  @Prop()
  stateCode?: string;

  @Prop()
  zipCode?: string;

  @Prop()
  congressionalDistrict?: string;

  @Prop()
  businessType?: string[];

  @Prop()
  sbaBusinessTypeDesc?: string[];

  @Prop({ type: Date })
  registrationDate?: Date;

  @Prop({ type: Date })
  expirationDate?: Date;

  @Prop()
  registrationStatus?: string;

  @Prop()
  primaryContactName?: string;

  @Prop()
  primaryContactEmail?: string;

  @Prop()
  primaryContactPhone?: string;

  @Prop()
  website?: string;

  @Prop({ default: 'pending' })
  probeStatus?: string;

  @Prop({ type: Date })
  lastProbed?: Date;

  @Prop({ type: Object })
  probeData?: Record<string, unknown>;

  @Prop({ type: [Object] })
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

export const LeadSchema = SchemaFactory.createForClass(Lead);
