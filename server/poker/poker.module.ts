import { Logger, Module } from '@nestjs/common';
import { PokerGateway } from './poker.gateway';
import { TableService } from './table/table.service';
import { PokerController } from './poker.controller';

@Module({
	imports: [],
	controllers: [PokerController],
	providers: [Logger, TableService, PokerGateway],
})
export class PokerModule {
}
