import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Env } from './common/env';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: `./db/${Env.DB_NAME}`,
      synchronize: true,
      entities: [],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
