import { OneDayForecastDto } from './one-day-forecast.dto';

export class ResponseGetForecastDto {
  cityName: string;
  forecast: OneDayForecastDto[];
}
