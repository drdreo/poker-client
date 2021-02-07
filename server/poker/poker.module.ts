import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PokerGateway } from './poker.gateway';
import { TableService } from './table/table.service';
import { PokerController } from './poker.controller';

@Module({
	imports: [ConfigModule],
	controllers: [PokerController],
	providers: [Logger, TableService, PokerGateway],
})
export class PokerModule {
}
