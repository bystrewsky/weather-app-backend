import { OpenWeatherForecastElementDto } from './open-weather-forecast-element.dto';

export class OpenWeatherResponseDto {
  readonly cod: string;
  readonly message: string | number;
  readonly cnt: number;
  readonly list: OpenWeatherForecastElementDto[];
  readonly city: {
    name: string;
  }
}
