import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { OneDayForecastDto } from './common/dto/one-day-forecast.dto';
import { OpenWeatherForecastElementDto } from './common/dto/open-weather-forecast-element.dto';
import { OpenWeatherResponseDto } from './common/dto/open-weather-response.dto';
import { ResponseGetForecastDto } from './common/dto/response-get-forecast.dto';
import { Env } from './common/env';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService
  ) {}

  private parseForecastResult(data: OpenWeatherForecastElementDto[]): OneDayForecastDto[] {
    if (!data || !data.length) {
      throw new HttpException('Cannot parse OpenWeather response', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const forecasts: OneDayForecastDto[] = data.map(item => {
      return new OneDayForecastDto(
        item.main.temp,
        new Date(item.dt * 1000)
      )
    });

    return forecasts;
  }

  private async requestForecast(searchQuery: string): Promise<ResponseGetForecastDto> {
    let result: AxiosResponse<OpenWeatherResponseDto>;

    try {
      result = await this.httpService.get(Env.OPEN_WEATHER_MAP_API_URL, {
        params: { q: searchQuery, appid: Env.OPEN_WEATHER_MAP_API_KEY, units: 'metric' },
      }).toPromise();
    } catch (e) {
      throw new HttpException(e.response.statusText, e.response.status);
    }

    return {
      cityName: result.data.city.name,
      forecast: this.parseForecastResult(result.data.list),
    }
  }

  public async getForecast(cityName: string): Promise<ResponseGetForecastDto> {
    return await this.requestForecast(cityName);
  }
}
