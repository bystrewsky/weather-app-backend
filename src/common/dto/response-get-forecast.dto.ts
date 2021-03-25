import { ThreeHourForecastDto } from './one-day-forecast.dto';

export class ResponseGetForecastDto {
  cityName: string;
  forecast: ThreeHourForecastDto[];
}
