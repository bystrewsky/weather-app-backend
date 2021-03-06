import { AfterLoad, BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ThreeHourForecastDto } from '../dto/one-day-forecast.dto';

@Entity()
export class Forecast {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'simple-array', nullable: false })
  forecastData: string | ThreeHourForecastDto[];

  @Column({ type: 'text' })
  cityName: string;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  encodeData() {
    this.forecastData = JSON.stringify(this.forecastData);
  }

  @AfterLoad()
  decodeData() {
    this.forecastData = JSON.parse(this.forecastData as string);
  }

  constructor(
    cityName: string,
    forecastData: ThreeHourForecastDto[]
  ) {
    this.cityName = cityName;
    this.forecastData = forecastData;
  }
}
