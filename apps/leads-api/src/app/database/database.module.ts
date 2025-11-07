import { Module, OnModuleDestroy } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log('📦 In-Memory MongoDB started at:', uri);
        return { uri };
      },
    }),
  ],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() {
    if (mongod) {
      await mongod.stop();
      console.log('📦 In-Memory MongoDB stopped');
    }
  }
}
