import { Logger, Module } from '@nestjs/common';
import { PokerGateway } from './poker.gateway';
import { TableService } from './table/table.service';

@Module({
	imports: [],
	providers: [Logger, TableService, PokerGateway],
})
export class PokerModule {
}
