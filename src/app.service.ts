import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { OneDayForecastDto } from './common/dto/one-day-forecast.dto';
import { OpenWeatherForecastElementDto } from './common/dto/open-weather-forecast-element.dto';
import { OpenWeatherResponseDto } from './common/dto/open-weather-response.dto';
import { ResponseGetForecastDto } from './common/dto/response-get-forecast.dto';
import { Env } from './common/env';

@Injectable()
export class AppService {
  private coefficient: number = 0.02;

  constructor(
    private readonly httpService: HttpService
  ) { }

  private getIndex(length: number, currentIndex: number, step: number, isPositive = true): number {
    if (isPositive) {
      return currentIndex + step < length ? currentIndex + step : currentIndex + step - length;
    }

    return currentIndex - step >= 0 ? currentIndex - step : length - Math.abs(currentIndex - step);
  }

  private getAvgTemperature(data, index, isPositive = true): number {
    let tempSum: number = 0;

    for (let i = 1; i <= 3; i++) {
      tempSum += data[this.getIndex(data.length, index, i, isPositive)].temperature;
    }

    return Number((tempSum / 3).toFixed(2));
  }

  private extendForecast(data: OneDayForecastDto[]): OneDayForecastDto[] {
    const forecastLength: number = data.length;
    const extendedResults: OneDayForecastDto[] = [];

    for (let i = 0; i < forecastLength; i++) {
      const tempAvgBefore: number = this.getAvgTemperature(data, i, false) * (1 - i * this.coefficient);
      const tempAvgAfter: number = this.getAvgTemperature(data, i, true) * i * this.coefficient;
      const temperature: number = (data[i].temperature + tempAvgBefore + tempAvgAfter) / 2;

      extendedResults.push(
        new OneDayForecastDto(
          Number(temperature.toFixed(2)),
          new Date(data[i].date.getTime() + 5 * 24 * 60 * 60 * 1000),
        )
      );
    }

    return extendedResults;
  }

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
    const givenForecast: ResponseGetForecastDto = await this.requestForecast(cityName);
    const extendedForecast: OneDayForecastDto[] = this.extendForecast(givenForecast.forecast);

    return {
      cityName: givenForecast.cityName,
      forecast: [
        ...givenForecast.forecast,
        ...extendedForecast,
      ],
    };
  }
}
