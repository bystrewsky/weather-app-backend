import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Forecast } from './common/entity/forecast.entity';
import { Env } from './common/env';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: `./db/${Env.DB_NAME}`,
      synchronize: true,
      entities: [ Forecast ],
    }),
    TypeOrmModule.forFeature([ Forecast ]),
  ],
  controllers: [ AppController ],
  providers: [ AppService, ],
})
export class AppModule {}
