import { BetType, Card, Winner, GameStatus, SidePot } from '../../../../shared/src';
import { Round } from '../Game';

export enum TableCommandName{
    HomeInfo = 'home_info',
    GameStarted = 'game_started',
    PlayerUpdate = 'player_update',
    PlayerBet = 'player_bet',
    MaxBetUpdate = 'max-bet_update',
    PlayersCards = 'players_cards',
    PotUpdate = 'pot_update',
    GameEnded = 'game_ended',
    GameStatus = 'game_status',
    GameWinners = 'game_winners',
    CurrentPlayer = 'current_player',
    Dealer = 'dealer',
    BoardUpdated = 'board_updated',
    NewRound = 'new_round',
    TableClosed = 'table_closed',
}

export interface TableCommand {
    name: TableCommandName;
    table: string;
    data?: {
        players?,
        playerID?: string,
        currentPlayerID?: string,
        dealerPlayerID?: string,
        pot?: number,
        sidePots?: SidePot[],
        bet?: number,
        maxBet?: number,
        type?: BetType,
        board?: Card[],
        round?: Round,
        winners?: Winner[],
        gameStatus?: GameStatus
    };
}
