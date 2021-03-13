export enum PokerEvent {
    HomeInfo = 'server:home:info',

    Joined = 'server:joined',

    GameStarted = 'server:game:started',
    GameEnded = 'server:game:ended',
    GameStatus = 'server:game:status',
    GameWinners = 'server:game:winners',

    PlayerLeft = 'server:player:left',
    PlayersUpdate = 'server:players_update',

    CurrentPlayer = 'server:game:current_player',
    PlayersCards = 'server:players_cards',
    DealerUpdate = 'server:game:dealer',

    // Table Stuff
    PotUpdate = 'server:pot_update',
    BoardUpdate = 'server:game:board_updated',
    MaxBetUpdate = 'server:game:max-bet_updated',
    NewRound = 'server:game:new_round',
    TableClosed = 'server:table:closed',

    // Actions
    PlayerChecked = 'server:checked',
    PlayerCalled = 'server:called',
    PlayerFolded = 'server:folded',
    PlayerBet = 'server:bet',
}


export enum PlayerEvent {
    Fold = 'player:fold',
    Bet = 'player:bet',
    Call = 'player:call',
    Check = 'player:check',


    JoinRoom = 'join',
    Leave = 'leave',
    StartGame = 'start_game',

}
