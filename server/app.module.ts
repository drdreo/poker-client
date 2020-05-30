import { Module } from '@nestjs/common';
import { PokerModule } from './poker/poker.module';

@Module({
	imports: [PokerModule],
})
export class AppModule {
}
