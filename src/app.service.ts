import { HttpException, HttpService, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { Repository } from 'typeorm';
import { OneDayForecastDto } from './common/dto/one-day-forecast.dto';
import { OpenWeatherForecastElementDto } from './common/dto/open-weather-forecast-element.dto';
import { OpenWeatherResponseDto } from './common/dto/open-weather-response.dto';
import { ResponseGetForecastDto } from './common/dto/response-get-forecast.dto';
import { Forecast } from './common/entity/forecast.entity';
import { Env } from './common/env';

@Injectable()
export class AppService {
  private coefficient: number = 0.02;

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Forecast)
    private readonly forecastRepository: Repository<Forecast>
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

  private async findCachedForecast(cityName: string): Promise<Forecast> {
    const now = new Date();

    return await this.forecastRepository.createQueryBuilder()
      .where('cityName = :cityName', { cityName })
      .andWhere('createdAt >= :date', { date: new Date(now.setHours(0, 0, 0, 0)) })
      .getOne();
  }

  private async createCachedForecast(data: ResponseGetForecastDto): Promise<void> {
    await this.forecastRepository.save(new Forecast(data.cityName, data.forecast));
  }

  private async requestForecast(searchQuery: string): Promise<ResponseGetForecastDto> {
    let result: AxiosResponse<OpenWeatherResponseDto>;

    try {
      result = await this.httpService.get(Env.OPEN_WEATHER_MAP_API_URL, {
        params: { q: searchQuery, appid: Env.OPEN_WEATHER_MAP_API_KEY, units: 'metric' },
      }).toPromise();
    } catch (e) {
      throw new HttpException(e.response.status === HttpStatus.NOT_FOUND ? 'City not found' : e.response.statusText, e.response.status);
    }

    return {
      cityName: result.data.city.name,
      forecast: this.parseForecastResult(result.data.list),
    }
  }

  public async getForecast(cityName: string): Promise<ResponseGetForecastDto> {
    const cachedForecast: Forecast = await this.findCachedForecast(cityName);

    if (cachedForecast) {
      return {
        cityName: cachedForecast.cityName,
        forecast: cachedForecast.forecastData as OneDayForecastDto[],
      };
    }

    const givenForecast: ResponseGetForecastDto = await this.requestForecast(cityName);
    const extendedForecast: OneDayForecastDto[] = this.extendForecast(givenForecast.forecast);
    const dataToReturn: ResponseGetForecastDto = {
      cityName: givenForecast.cityName,
      forecast: [
        ...givenForecast.forecast,
        ...extendedForecast,
      ],
    };

    await this.createCachedForecast(dataToReturn);

    return dataToReturn;
  }
}
