import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { devConfig } from './config/configuration';
import { prodConfig } from './config/configuration.prod';
import { testConfig } from './config/configuration.test';
import { PokerModule } from './poker/poker.module';


console.log('ENVIRONMENT: ' + process.env.NODE_ENV || 'dev');
console.log('Production: ' + process.env.production);

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [process.env.NODE_ENV === 'prod' ? prodConfig : process.env.NODE_ENV === 'test' ? testConfig : devConfig],
        }),
        PokerModule]
})
export class AppModule {
}
