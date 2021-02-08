import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { devConfig, Environment } from './config/configuration';
import { prodConfig } from './config/configuration.prod';
import { testConfig } from './config/configuration.test';
import { PokerModule } from './poker/poker.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [process.env.NODE_ENV === Environment.PROD ? prodConfig : process.env.NODE_ENV === Environment.TEST ? testConfig : devConfig]
        }),
        PokerModule]
})
export class AppModule {

}
