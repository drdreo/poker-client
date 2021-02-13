export interface PlayerChecked {
    playerID: string;
}

export interface PlayerCalled {
    playerID: string;
}

export interface PlayerFolded {
    playerID: string;
}

export interface PlayerBet {
    playerID: string;
    bet: number;
    maxBet: number;
    type: BetType
}


export enum RoundType {
    Deal = 'Deal',
    Flop = 'Flop',
    Turn = 'Turn',
    River = 'River'
}

export enum BetType {
    SmallBlind,
    BigBlind,
    Bet,
    Raise,
    ReRaise,
}

export interface PokerTable {
    name: string;
    started: boolean;
}

export interface HomeInfo {
    tables: PokerTable[];
    players: number;
}

export interface TableResponse {
    name: string;
    players: PlayerOverview[];
}

export interface ServerJoined {
    playerID: string;
    table: string;
}

export interface PlayerLeft {
    playerID: string;
}

export interface GameWinners {
    winners: Winner[];
    pot: number;
}

export interface PlayerOverview {
    id: string;
    name: string;
    chips: number;
    color: string;
    bet?: number
    cards?: Card[];
    allIn: boolean;
    folded: boolean;
    disconnected: boolean;
}

export interface SplitPot {
    amount: number;
    playerIDs: string[];
}

export interface Winner extends Pick<PlayerOverview, 'name' | 'chips'> {
    hand?: {
        handName: string;
        handType: number;
    }
}

export interface GamePlayersUpdate {
    players: PlayerOverview[];
}

export interface GameCurrentPlayer {
    currentPlayerID: string;
}

export interface GameDealerUpdate {
    dealerPlayerID: string;
}

export interface GameBoardUpdate {
    board: Card[];
}

export interface GamePotUpdate {
    pot: number;
    splitPots: SplitPot[];
}

export interface GameRoundUpdate {
    round: any;
}

export interface Card {
    value: string | number;
    figure: string;
}
