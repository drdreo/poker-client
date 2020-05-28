import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PokerModule } from './poker/poker.module';

@Module({
	imports: [PokerModule],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {
}
