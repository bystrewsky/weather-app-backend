import { IsString, Length } from 'class-validator';

export class RequestGetForecastDto {
  @IsString({ message: 'City name must be a string' })
  @Length(2, 64, { message: 'City name must contain from 2 to 64 symbols' })
  city: string;
}
