import { Game } from './Game';

describe('Game', () => {
    let game: Game;
    let smallBlind = 10;
    let bigBlind = 20;

    beforeEach(() => {
        game = new Game(smallBlind, bigBlind, 'TestGame');
    });

    it('should not have a board', () => {
        expect(game.board.length).toEqual(0);
    });

    it('should fill the deck', () => {
        expect(game.deck.length).toEqual(52);
    });
});
