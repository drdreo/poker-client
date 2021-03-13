import { RoundType } from '../../../../shared/src';
import { testConfig } from '../../config/configuration.test';
import { TableMock } from './Table.mock';
import { TableCommandName } from './TableCommand';

const CONFIG = testConfig();

let counter = 1;

describe('Table', () => {
    let table: TableMock;
    let smallBlind = 10;
    let bigBlind = 20;

    beforeEach(() => {
        table = new TableMock({ ...CONFIG.TABLE }, smallBlind, bigBlind, 2, 5, 'TestTable' + counter++);
    });

    afterEach(async () => {
        if (table) {
            table.destroy();
        }
    });

    it('should have no Game', () => {
        expect(table.hasGame()).toBe(false);
    });

    describe('addPlayer', () => {
        it('should add a player', () => {
            table.addPlayer('Tester1', 1000);
            expect(table.players.length).toBe(1);
        });

        it('should return a new playerID', () => {
            const playerID = table.addPlayer('Tester1', 1000);
            expect(playerID.length).toBeGreaterThan(10);
        });

        it('should throw a game already started error', () => {
            table.addPlayer('Tester1', 1000);
            table.addPlayer('Tester2', 1000);
            table.newGame();
            expect(() => {
                table.addPlayer('Tester3', 1000);
            }).toThrow();
        });

        it('should throw a game already full error', () => {
            table.maxPlayers = 2;
            table.addPlayer('Tester1', 1000);
            table.addPlayer('Tester2', 1000);
            expect(() => {
                table.addPlayer('Tester3', 1000);
            }).toThrow();
        });
    });

    describe('newGame', () => {
        beforeEach(() => {
            table.addPlayer('Tester1', 1000);
            table.addPlayer('Tester2', 1000);
            table.newGame();
        });

        it('should throw a too less players error', () => {
            table.players = [];
            expect(() => {
                table.newGame();
            }).toThrow();
        });

        it('should create a new Game', () => {
            expect(table.hasGame()).toBe(true);
        });

        it('should have a currentPlayer set', () => {
            expect(table.currentPlayer).toBeDefined();
        });

        it('should deal 2 cards to each players', () => {
            const everyoneHasCards = table.players.every(player => player.cards.length === 2);
            expect(everyoneHasCards).toBe(true);
        });

        it('should deal 2 cards to each players after consequent games', () => {
            table.newGame();
            table.newGame();
            const everyoneHasCards = table.players.every(player => player.cards.length === 2);
            expect(everyoneHasCards).toBe(true);
        });
    });

    function rigCardsForThirdPlayer(player1, player2, player3) {
        table.getPlayer(player1).cards = ['3D', '7C'];
        table.getPlayer(player2).cards = ['2D', '6C'];
        table.getPlayer(player3).cards = ['JD', 'TD'];
    }

    function rigBoardForRoyalFlush() {
        table.getGame().board = ['AD', 'KD', 'QD', '2S', '2C'];
    }

    describe('Game Mechanics (2 Players)', () => {
        let player1;
        let player2;

        beforeEach(() => {
            player1 = table.addPlayer('Tester1', 1000);
            player2 = table.addPlayer('Tester2', 1000);
            table.newGame();
        });

        it('should set dealer SB in heads up and act first', () => {

            const player2Idx = table.getPlayerIndexByID(player2);
            expect(player2Idx).toBe(table.dealer);
            expect(player2Idx).toBe(table.currentPlayer);
        });
    });

    describe('Game Mechanics (3 players)', () => {

        let player1;
        let player2;
        let player3;

        beforeEach(() => {
            player1 = table.addPlayer('Tester1', 1000);
            player2 = table.addPlayer('Tester2', 1000);
            player3 = table.addPlayer('Tester3', 1000);
            table.newGame();
        });

        describe('Turn logic', () => {

            it('should throw a not your turn error', () => {
                expect(() => {
                    table.bet(player1, smallBlind);
                }).toThrow();
            });

            it('auto bet the blinds', () => {
                const p1 = table.getPlayer(player1);
                const p2 = table.getPlayer(player2);
                const p3 = table.getPlayer(player3);
                expect(p1.chips).toBe(990);
                expect(p2.chips).toBe(980);
                expect(p3.chips).toBe(1000);
            });

            it('should set last player as dealer', () => {
                const player3Idx = table.getPlayerIndexByID(player3);
                expect(player3Idx).toBe(table.dealer);
                expect(player3Idx).toBe(table.currentPlayer); // current player should be 3rd player, 1 and 2 are blinds
            });

            it('should set correct next player after folding', () => {
                table.fold(player3);

                let currentPlayer = table.getPlayerIndexByID(player1);
                expect(table.currentPlayer).toBe(currentPlayer);
            });

            it('should set correct next player after folding as first player', () => {
                table.call(player3);
                table.fold(player1);

                let currentPlayer = table.getPlayerIndexByID(player2);
                expect(table.currentPlayer).toBe(currentPlayer);

                table.check(player2); // BB check

                currentPlayer = table.getPlayerIndexByID(player2);
                expect(table.currentPlayer).toBe(currentPlayer);

                table.check(player2);

                currentPlayer = table.getPlayerIndexByID(player3);
                expect(table.currentPlayer).toBe(currentPlayer);
            });

            it('should set correct next player after raise', () => {
                let currentPlayer;

                table.bet(player3, 2 * bigBlind);
                currentPlayer = table.getPlayerIndexByID(player1);
                expect(table.currentPlayer).toBe(currentPlayer);

                table.call(player1);
                currentPlayer = table.getPlayerIndexByID(player2);
                expect(table.currentPlayer).toBe(currentPlayer);

                table.call(player2);
                // next round
                currentPlayer = table.getPlayerIndexByID(player1);
                expect(table.currentPlayer).toBe(currentPlayer);
            });

            it('should give the big blind an option if it was called', () => {
                table.call(player3);
                table.call(player1);

                expect(table.getRoundType()).toBe(RoundType.Deal);
                let currentPlayer = table.getPlayerIndexByID(player2);
                expect(table.currentPlayer).toBe(currentPlayer);
                table.check(player2);

                expect(table.getRoundType()).toBe(RoundType.Flop);
            });

            it('should give the big blind an option, if it raises, should not progress', () => {
                table.call(player3);
                table.call(player1);

                expect(table.getRoundType()).toBe(RoundType.Deal);

                table.bet(player2, 100);

                expect(table.getRoundType()).toBe(RoundType.Deal);
                let currentPlayer = table.getPlayerIndexByID(player3);
                expect(table.currentPlayer).toBe(currentPlayer);
            });


            it('should stay in the same Round(Deal) after everyone called the blinds', () => {
                expect(table.getRoundType()).toBe(RoundType.Deal);

                table.call(player3);
                table.call(player1);

                expect(table.getRoundType()).toBe(RoundType.Deal);
            });

            it('should progress to the next Round(Flop) after BB checked', () => {
                expect(table.getRoundType()).toBe(RoundType.Deal);

                table.call(player3);
                table.call(player1);
                table.check(player2);

                expect(table.getRoundType()).toBe(RoundType.Flop);
            });


            it('should stay in the same Round after Raise', () => {

                table.bet(player3, bigBlind * 2);
                table.call(player1);

                expect(table.getRoundType()).toBe(RoundType.Deal);
            });

            it('should continue to next Round(Flop) after Raise was called', () => {

                table.bet(player3, bigBlind * 2);
                table.call(player1);
                table.call(player2);

                expect(table.getRoundType()).toBe(RoundType.Flop);
            });

            it('should stay in Round(Deal) after Re-Raise', () => {

                table.bet(player3, bigBlind * 2);
                table.bet(player1, bigBlind * 3);
                table.call(player2);

                expect(table.getRoundType()).toBe(RoundType.Deal);
            });

            it('should continue with Round(Flop) after Re-Raise was called', () => {

                table.bet(player3, bigBlind * 2);
                table.bet(player1, bigBlind * 3);
                table.call(player2);
                table.call(player3);

                expect(table.getRoundType()).toBe(RoundType.Flop);
            });

            it('should stay in Round(Deal) after Re-Raise', () => {

                table.bet(player3, bigBlind * 2);
                table.bet(player1, bigBlind * 3);
                table.bet(player2, bigBlind * 4);
                table.call(player3);

                expect(table.getRoundType()).toBe(RoundType.Deal);
            });

            it('should continue with Round(Flop) after Re-Raise was called', () => {

                table.bet(player3, bigBlind * 2);
                table.bet(player1, bigBlind * 3);
                table.bet(player2, bigBlind * 4);
                table.call(player3);
                table.call(player1);

                expect(table.getRoundType()).toBe(RoundType.Flop);
            });
        });

        it('should set correct bets', () => {
            table.bet(player3, bigBlind * 2);

            expect(table.getGame().getBetAmount(0)).toBe(smallBlind);
            expect(table.getGame().getBetAmount(1)).toBe(bigBlind);
            expect(table.getGame().getBetAmount(2)).toBe(bigBlind * 2);
        });

        it('should be all in', () => {
            expect(table.getPlayer(player3).allIn).toBeFalsy();
            table.bet(player3, 1000);
            expect(table.getPlayer(player3).allIn).toBeTruthy();
        });

        it('should have nothing in the pot after everyone called the blinds', () => {

            table.call(player3);
            table.call(player1);

            expect(table.getGame().pot).toBe(0);
        });

        it('should have the correct amount in the pot after everyone called the blinds', () => {

            table.call(player3);
            table.call(player1);
            table.check(player2);

            expect(table.getGame().pot).toBe(60);
        });

        it('should add bets after raising your own blind', () => {
            table.call(player3);
            table.bet(player1, bigBlind * 3);

            const maxBet = 70; // small blind + 3 * BB
            expect(table.getGame().getMaxBet()).toBe(maxBet);
        });

        it('should have the correct amount in the pot after raise', () => {
            table.call(player3);
            table.bet(player1, bigBlind * 3);
            table.call(player2);
            table.call(player3);

            const pot = 210; //10, 20, 20, 60, 50, 50
            expect(table.getGame().pot).toBe(pot);
        });

        it('should have ended when everyone folds', done => {
            table.commands$.subscribe((command) => {
                if (command.name === TableCommandName.GameEnded) {
                    done();
                }
            });
            table.fold(player3);
            table.fold(player1);
        }, 1000);

        it('should pay small + big blinds to the winner if everyone folds', done => {
            table.commands$.subscribe((command) => {
                if (command.name === TableCommandName.GameWinners) {
                    const { winners } = command.data;
                    expect(winners[0].amount).toBe(smallBlind + bigBlind);
                    expect(table.getPlayer(winners[0].id).chips).toBe(1030);
                    done();
                }
            });

            table.bet(player3, 200);
            table.fold(player1);
            table.fold(player2);
        });

        it('should return bet if everyone folds', done => {
            table.commands$.subscribe((command) => {
                if (command.name === TableCommandName.GameWinners) {
                    expect(table.getPlayer(player3).chips).toBe(1000 + smallBlind + bigBlind);
                    done();
                }
            });

            table.bet(player3, 200);
            table.fold(player1);
            table.fold(player2);
        });

        describe('Round(Flop)', () => {
            beforeEach(() => {
                // Round(Deal)
                table.call(player3);
                table.call(player1);
                table.check(player2);
            });

            it('should have 60 chips in the pot', () => {
                expect(table.getGame().pot).toBe(60);
            });

            it('should have 60 chips in the pot after checking', () => {
                table.check(player1);
                table.check(player2);
                table.check(player3);
                expect(table.getGame().pot).toBe(60);
            });

            it('should have 120 chips in the pot after raising', () => {
                table.bet(player1, smallBlind);
                table.bet(player2, bigBlind);
                table.call(player3);
                table.call(player1);
                expect(table.getGame().pot).toBe(120);
            });

            it('should have 3 cards on the board', () => {
                expect(table.getGame().board.length).toBe(3);
            });

            it('should progress with next Round(Turn) after everyone checked', () => {
                table.check(player1);
                table.check(player2);
                table.check(player3);

                expect(table.getRoundType()).toBe(RoundType.Turn);
            });

            it('should progress with next Round(Turn) after everyone checked OR folded', () => {
                table.check(player1);
                table.check(player2);
                table.fold(player3);

                expect(table.getRoundType()).toBe(RoundType.Turn);
            });

            it('should NOT progress to next Round(Turn) after someone raised a check-streak', () => {
                table.check(player1);
                table.check(player2);
                table.bet(player3, bigBlind * 2);

                expect(table.getRoundType()).toBe(RoundType.Flop);
            });

            it('should progress to next Round(Turn) after all called the Raise of a check-streak', () => {
                table.check(player1);
                table.check(player2);
                table.bet(player3, bigBlind * 2);
                table.call(player1);
                table.call(player2);

                expect(table.getRoundType()).toBe(RoundType.Turn);
            });

            it('should progress to next Round(Turn) after all called OR folded the Raise of a check-streak', () => {
                table.check(player1);
                table.check(player2);
                table.bet(player3, bigBlind * 2);
                table.fold(player1);
                table.call(player2);

                expect(table.getRoundType()).toBe(RoundType.Turn);
            });

            describe('Round(Turn)', () => {
                beforeEach(() => {
                    // Round(Flop)
                    table.bet(player1, smallBlind);
                    table.bet(player2, bigBlind);
                    table.call(player3);
                    table.call(player1);
                });

                it('should have 120 chips in the pot', () => {
                    expect(table.getGame().pot).toBe(120);
                });

                it('should have 120 chips in the pot after checking', () => {
                    table.check(player1);
                    table.check(player2);
                    table.check(player3);
                    expect(table.getGame().pot).toBe(120);
                });

                it('should have 160 chips in the pot after one folded', () => {
                    table.bet(player1, bigBlind);
                    table.call(player2);
                    table.fold(player3);

                    expect(table.getGame().pot).toBe(160);
                });

                it('should have 4 cards on the board', () => {
                    expect(table.getGame().board.length).toBe(4);
                });

                describe('Round(River)', () => {
                    beforeEach(() => {
                        // Round(Turn)
                        table.bet(player1, smallBlind);
                        table.bet(player2, bigBlind);
                        table.call(player3);
                        table.call(player1);
                    });

                    it('should have 180 chips in the pot', () => {
                        expect(table.getGame().pot).toBe(180);
                    });

                    it('should have 5 cards in the board', () => {
                        expect(table.getGame().board.length).toEqual(5);
                    });

                    it('should have a pot of 180 after checking', () => {
                        table.check(player1);
                        table.check(player2);
                        table.check(player3);

                        expect(table.getGame().pot).toEqual(180);
                    });

                    it('should have a pot of 240', () => {
                        table.bet(player1, bigBlind);
                        table.call(player2);
                        table.call(player3);

                        expect(table.getGame().pot).toEqual(240);
                    });

                    it('should have ended when everyone checks', done => {
                        table.commands$.subscribe((command) => {
                            if (command.name === TableCommandName.GameEnded) {
                                done();
                            }
                        });

                        table.bet(player1, bigBlind);
                        table.call(player2);
                        table.call(player3);
                    }, 1000);

                    it('should have the correct pot and added it to the winner', done => {
                        table.commands$.subscribe((command) => {
                            if (command.name === TableCommandName.GameWinners) {
                                const { winners } = command.data;
                                expect(table.getPlayer(winners[0].id).chips).toBe(1160);
                                expect(winners[0].amount).toBe(240);
                                done();
                            }
                        });


                        // rig the player cards to prevent a side pot
                        table.getPlayer(player1).cards = ['JD', 'TD'];
                        table.getPlayer(player2).cards = ['3D', '4S'];
                        table.getPlayer(player3).cards = ['2D', '9C'];
                        table.getGame().board = ['AD', 'KD', 'QD', '2S', '2C'];

                        // coins: 920, pot: 240 => 1160
                        table.bet(player1, bigBlind);
                        table.call(player2);
                        table.call(player3);
                    }, 1000);
                });
            });
        });

        describe('Side pots ', () => {

            beforeEach(() => {
                // set player cash
                table.getPlayer(player1).chips = 200 - smallBlind;
                table.getPlayer(player2).chips = 250 - bigBlind;
                table.getPlayer(player3).chips = 100;
            });

            it('should have no side pot if one folds', () => {
                table.bet(player3, 50);
                table.fold(player1);
                table.call(player2);

                expect(table.getGame().pot).toBe(110);
            });

            it('should have no side pot if one folds after betting', done => {
                table.commands$.subscribe((command) => {
                    if (command.name === TableCommandName.GameWinners) {
                        expect(table.getPlayer(player3).chips).toBe(100 + smallBlind + 50);
                        done();
                    }
                });

                table.bet(player3, 50);
                table.fold(player1);
                table.call(player2);
                // new round
                table.check(player2);
                table.bet(player3, 20);
                table.fold(player2);
                // end of round
                expect(table.getGame().pot).toBe(110);

            });

            it('should NOT create a side pot when player 3 is all-in and others call', () => {
                table.bet(player3, table.getPlayer(player3).chips); // all in
                table.call(player1);
                table.call(player2);
                expect(table.getPlayer(player3).allIn).toBeTruthy();
                expect(table.getGame().sidePots[0]).toBeUndefined();
                expect(table.getGame().pot).toBe(300);
            });

            it('should create a side pot when player 3 is all-in , player 1 calls and player 2 raises all-in and player 1 has to all-in ', () => {
                // P3 is all-in with 100 --> 1st Side pot with 100 (300 total)
                // P2 is all-in with 250 --> 2nd Side pot with other 100
                // P1 is all-in with 200 --> adds to 2nd Side pot (main pot) with other 100 (200 total)
                // P2 gets his extra 50 back

                table.bet(player3, table.getPlayer(player3).chips); // all in
                table.call(player1);
                table.bet(player2, table.getPlayer(player2).chips); // all in
                table.bet(player1, table.getPlayer(player1).chips);


                expect(table.getPlayer(player1).allIn).toBeTruthy();
                expect(table.getPlayer(player2).allIn).toBeTruthy();
                expect(table.getPlayer(player3).allIn).toBeTruthy();

                expect(table.getGame().sidePots[0]).toBeDefined();
                expect(table.getGame().pot).toBe(200);

                expect(table.getPlayer(player1).chips).toBe(0);
                expect(table.getPlayer(player2).chips).toBe(50);
                expect(table.getPlayer(player3).chips).toBe(0);

                expect(table.getRoundType()).toBe(RoundType.River);
            });


            it('should continue with rounds when player 3 is immediately all-in', () => {
                table.bet(player3, table.getPlayer(player3).chips); // all in
                table.call(player1);
                table.call(player2);


                expect(table.getPlayer(player3).allIn).toBeTruthy();
                expect(table.getRoundType()).toBe(RoundType.Flop);
                expect(table.getGame().pot).toBe(300);
            });

            it('should start next round if player 3 is ending the round with all-in', () => {
                table.bet(player3, 50);
                table.bet(player1, 140);
                table.call(player2);
                table.bet(player3, table.getPlayer(player3).chips); // all in


                expect(table.getPlayer(player3).allIn).toBeTruthy();

                expect(table.getGame().pot).toBe(100);
                expect(table.getGame().sidePots[0]).toBeDefined();
                expect(table.getGame().sidePots[0].amount).toBe(300);

                expect(table.getRoundType()).toBe(RoundType.Flop);
            });

            it('should create only one side pot when player 3 is all-in and the others continue', () => {
                table.bet(player3, table.getPlayer(player3).chips); // all in
                table.call(player1);
                table.call(player2);

                expect(table.getRoundType()).toBe(RoundType.Flop);

                table.bet(player1, 20);
                table.call(player2);

                expect(table.getRoundType()).toBe(RoundType.Turn);


                expect(table.getGame().sidePots[0]).toBeDefined();
                expect(table.getGame().sidePots[0]?.amount).toBe(300);
                expect(table.getGame().pot).toBe(40);

                table.bet(player1, 20);
                table.bet(player2, 30);
                table.call(player1);

                expect(table.getRoundType()).toBe(RoundType.River);
                expect(table.getGame().pot).toBe(100);
                expect(table.getGame().sidePots[0].amount).toBe(300);
                expect(table.getGame().sidePots[1]).toBeUndefined();
            });

            it('should not create a second sidepot when player 2 is all-in in the last round', () => {
                table.bet(player3, table.getPlayer(player3).chips); // all in
                table.call(player1);
                table.call(player2);

                expect(table.getRoundType()).toBe(RoundType.Flop);

                table.bet(player1, 20);
                table.call(player2);

                // should trigger auto play
                expect(table.getRoundType()).toBe(RoundType.Turn);


                expect(table.getGame().sidePots[0]).toBeDefined();
                expect(table.getGame().sidePots[0]?.amount).toBe(300);
                expect(table.getGame().pot).toBe(40);

                table.bet(player1, table.getPlayer(player1).chips); // all in
                table.call(player2);

                expect(table.getRoundType()).toBe(RoundType.River);
                expect(table.getGame().pot).toBe(200);
                expect(table.getGame().sidePots[0].amount).toBe(300);
                expect(table.getGame().sidePots[1]).toBeUndefined();
            });

            it('should process winners if player 2 folds after player 3 is all-in', done => {
                table.commands$.subscribe((command) => {
                    if (command.name === TableCommandName.GameWinners) {
                        const { winners } = command.data;
                        expect(winners[0].amount).toBe(220);

                        // expect(table.getPlayer(winners[0].id).chips).toBe(320 / winners.length);
                        done();
                    }
                });

                // rig the test player cards
                table.getPlayer(player1).cards = ['AD', 'AS'];
                table.getPlayer(player3).cards = ['2D', '9C'];


                table.bet(player3, table.getPlayer(player3).chips); // all in
                table.call(player1); // 10 + 90
                table.fold(player2);

                // this should trigger auto-play to the end
                expect(table.getGame().pot).toBe(220);
                expect(table.getRoundType()).toBe(RoundType.River);
            }, 500);

            it('should have correct pot if player 3 folds after betting and one is all-in', () => {
                // bets: 10, 20, 50, 190, 180 = 450
                table.bet(player3, 50);
                table.bet(player1, table.getPlayer(player1).chips); // all in
                table.call(player2);
                table.fold(player3);

                expect(table.getGame().sidePots[0]).toBeUndefined();
                expect(table.getGame().pot).toBe(450);
            });

            it('should create a side-pot and let poorer players still go all-in', () => {

                table.bet(player3, 50);
                table.bet(player1, table.getPlayer(player1).chips); // all in
                table.call(player2);
                table.bet(player3, 50); // all in

                expect(table.getGame().sidePots[0]).toBeDefined();
                expect(table.getGame().sidePots[0].amount).toBe(300);
                expect(table.getGame().pot).toBe(200);
            });

            it('should process bets correctly if one did not bet', () => {
                table.fold(player3);
                table.check(player1);
                table.bet(player2, table.getPlayer(player2).chips); // all in
                table.bet(player1, table.getPlayer(player1).chips); // all in

                expect(table.getGame().sidePots[0]).toBeUndefined();
                expect(table.getGame().pot).toBe(400);
            });

        });


        describe('Process Winners', () => {

            beforeEach(() => {
                // set player cash
                table.getPlayer(player1).chips = 200 - smallBlind;
                table.getPlayer(player2).chips = 250 - bigBlind;
                table.getPlayer(player3).chips = 100;
            });

            it('should pay out main pot to all-in player if won', done => {
                table.commands$.subscribe((command) => {
                    if (command.name === TableCommandName.GameWinners) {
                        const { winners } = command.data;
                        expect(winners[0].amount).toBe(300);
                        expect(table.getPlayer(winners[0].id).chips).toBe(300);
                        done();
                    }
                });

                // rig the test player cards
                rigCardsForThirdPlayer(player1, player2, player3);

                table.bet(player3, table.getPlayer(player3).chips); // all in
                table.call(player1);
                table.call(player2);

                // check until the end
                table.check(player1);
                table.check(player2);

                table.check(player1);
                table.check(player2);

                table.check(player1);

                expect(table.getGame().sidePots[0]).toBeUndefined();
                expect(table.getGame().pot).toBe(300);

                rigBoardForRoyalFlush();

                table.check(player2);
            });

            it('should pay out the side pot to all-in player and main pot to other', done => {
                table.commands$.subscribe((command) => {
                    if (command.name === TableCommandName.GameWinners) {
                        const { winners } = command.data;

                        const mainPotWinners = winners.filter(winner => winner.potType === 'main');
                        const sidePotWinners = winners.filter(winner => winner.potType.includes('sidepot'));
                        expect(mainPotWinners[0].amount).toBe(40 / mainPotWinners.length);
                        expect(mainPotWinners.every(player => player.id !== table.getPlayer(player3).id)).toBeTruthy();

                        expect(sidePotWinners.some(player => player.id === table.getPlayer(player3).id)).toBeTruthy();
                        expect(table.getPlayer(player3).chips).toBe(300);
                        done();
                    }
                });

                // rig the test player cards
                rigCardsForThirdPlayer(player1, player2, player3);

                table.bet(player3, table.getPlayer(player3).chips); // all in
                table.call(player1);
                table.call(player2);


                table.bet(player1, 20);
                table.call(player2);


                table.check(player1);
                table.check(player2);


                table.check(player1);

                expect(table.getGame().sidePots[0]).toBeDefined();
                expect(table.getGame().pot).toBe(40);

                rigBoardForRoyalFlush();

                table.check(player2);
            });

            it('should pay out each pot to player 1', done => {
                table.commands$.subscribe((command) => {
                    if (command.name === TableCommandName.GameWinners) {
                        const { winners } = command.data;

                        expect(winners.every(player => player.id === player1)).toBeTruthy();
                        expect(winners.reduce((sum, player) => sum + player.amount, 0)).toBe(340);
                        expect(table.getPlayer(player1).chips).toBe(420); // 80 + 340

                        done();
                    }
                });

                // rig the test player cards
                rigCardsForThirdPlayer(player3, player2, player1);

                table.bet(player3, table.getPlayer(player3).chips); // all in
                table.call(player1);
                table.call(player2);

                expect(table.getGame().pot).toBe(300);

                table.bet(player1, 20);
                table.call(player2);


                table.check(player1);
                table.check(player2);


                table.check(player1);

                expect(table.getGame().sidePots[0]).toBeDefined();
                expect(table.getGame().pot).toBe(40);

                rigBoardForRoyalFlush();

                table.check(player2);
            });
        });


        test.todo('should kick player from table if no chips left');
        test.todo('should kick all-in player after lose');
    });

    describe('Game Mechanics (5+ players)', () => {
        let player1;
        let player2;
        let player3;
        let player4;
        let player5;

        beforeEach(() => {
            player1 = table.addPlayer('Tester1', 1000);
            player2 = table.addPlayer('Tester2', 1000);
            player3 = table.addPlayer('Tester3', 1000);
            player4 = table.addPlayer('Tester4', 500);
            player5 = table.addPlayer('Tester5', 1000);
            table.newGame();
        });

        it('should process bets correctly if one did not bet', () => {
            table.call(player3);
            table.fold(player4);
            table.call(player5);
            table.call(player1);
            table.check(player2);

            expect(table.getGame().pot).toBe(80);
        });


        it('should process bets correctly if SB folds after all-in', () => {
            // 10, 20, 20, 500, 600, 580, 580 = 2310
            table.call(player3);
            table.bet(player4, table.getPlayer(player4).chips);
            table.bet(player5, 600);
            table.fold(player1);
            table.call(player2);
            table.call(player3);

            expect(table.getGame().pot).toBe(300);
            expect(table.getGame().sidePots[0]).toBeDefined();
            expect(table.getGame().sidePots[0].amount).toBe(50); // due to SB
            expect(table.getGame().sidePots[0].players.length).toBe(5); // due to SB
            expect(table.getGame().sidePots[1]).toBeDefined();
            expect(table.getGame().sidePots[1].amount).toBe(1960);
            expect(table.getGame().sidePots[1].players.length).toBe(4);
        });

        it('should process bets correctly if someone did not bet after all-in', () => {
            table.call(player3);
            table.bet(player4, table.getPlayer(player4).chips);
            table.fold(player5);
            table.call(player1);
            table.call(player2);
            table.call(player3);

            expect(table.getGame().pot).toBe(2000);
            expect(table.getGame().sidePots[0]).toBeUndefined();
        });

        it('should pay the winners correctly if SB folded after all-in', done => {
            table.commands$.subscribe((command) => {
                if (command.name === TableCommandName.GameWinners) {
                    const { winners } = command.data;

                    const totalEarnings = winners.reduce((prev, cur) => prev + cur.amount, 0);

                    expect(totalEarnings).toBe(2310);
                    done();
                }
            });

            // 10, 20, 20, 500, 600, 580, 580 = 2310
            table.call(player3);
            table.bet(player4, table.getPlayer(player4).chips);
            table.bet(player5, 600);
            table.fold(player1);
            table.call(player2);
            table.call(player3);

            table.check(player2);
            table.check(player3);
            table.check(player5);

            table.check(player2);
            table.check(player3);
            table.check(player5);

            table.check(player2);
            table.check(player3);
            table.check(player5);
        });
    });
});
