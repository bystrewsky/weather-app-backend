import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { RequestGetForecastDto } from './common/dto/request-get-forecast.dto';
import { ResponseGetForecastDto } from './common/dto/response-get-forecast.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/getForecast')
  async getForecast(@Query() query: RequestGetForecastDto): Promise<ResponseGetForecastDto> {
    return this.appService.getForecast(query.city);
  }
}
