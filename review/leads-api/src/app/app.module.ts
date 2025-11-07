import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LeadsService } from './services/leads.service';
import { SamApiService } from './services/sam-api.service';
import { Lead, LeadSchema } from './schemas/lead.schema';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
  ],
  controllers: [AppController],
  providers: [AppService, LeadsService, SamApiService],
})
export class AppModule {}
