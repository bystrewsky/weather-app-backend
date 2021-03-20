import { IsDefined, IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestGetForecastDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(2)
  city: string;
}
