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
    Call,
    Check,
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
}

export interface PlayerOverview {
    id: string;
    name: string;
    chips: number;
    color: string;
    bet?: Bet
    cards?: Card[];
    allIn: boolean;
    folded: boolean;
    disconnected: boolean;
}

export interface Bet{
    amount: number;
    type: BetType;
}

export interface SidePotPlayer{
    id: string;
    name: string;
    color: string;
    allIn: boolean;
}

export interface SidePot {
    amount: number;
    players: SidePotPlayer[];
}

export type PotType = "main" | "sidepot" | string;

export interface Winner extends Pick<PlayerOverview, 'id'| 'name' | 'allIn'> {
    potType: PotType,
    amount: number,
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
    sidePots: SidePot[];
}

export interface GameRoundUpdate {
    round: any;
}

export interface MaxBetUpdate {
    maxBet: number;
}

export interface Card {
    value: string | number;
    figure: string;
}
