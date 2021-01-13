import { RoundType } from '../Game';
import { TableMock } from './Table.mock';

describe('Table', () => {
    let table: TableMock;
    let smallBlind = 10;
    let bigBlind = 20;

    beforeEach(() => {
        table = new TableMock(smallBlind, bigBlind, 2, 5, 'TestTable');
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

    describe('Game Mechanics', () => {

        let player1;
        let player2;
        let player3;

        beforeEach(() => {
            player1 = table.addPlayer('Tester1', 1000);
            player2 = table.addPlayer('Tester2', 1000);
            player3 = table.addPlayer('Tester3', 1000);
            table.newGame();
        });


        it('should throw a not your turn error', () => {
            table.bet(player1, smallBlind);
            expect(() => {
                table.bet(player3, smallBlind);
            }).toThrow();
        });

        it('should set correct next player after folding', () => {

            table.bet(player1, smallBlind);
            table.call(player2);
            table.fold(player3);

            let currentPlayer = table.getPlayerIndexByID(player1);
            expect(table.currentPlayer).toBe(currentPlayer);
        });

        it('should set correct next player after folding as first player', () => {

            table.bet(player1, smallBlind);
            table.call(player2);
            table.call(player3);
            table.fold(player1);

            let currentPlayer = table.getPlayerIndexByID(player2);
            expect(table.currentPlayer).toBe(currentPlayer);

            table.check(player2);

            currentPlayer = table.getPlayerIndexByID(player3);
            expect(table.currentPlayer).toBe(currentPlayer);

            table.check(player3);

            currentPlayer = table.getPlayerIndexByID(player2);
            expect(table.currentPlayer).toBe(currentPlayer);
        });

        it('should set correct next player after raise', () => {
            let currentPlayer = table.getPlayerIndexByID(player2);

            table.bet(player1, smallBlind);
            expect(table.currentPlayer).toBe(currentPlayer);

            table.bet(player2, bigBlind);
            currentPlayer = table.getPlayerIndexByID(player3);
            expect(table.currentPlayer).toBe(currentPlayer);

            table.bet(player3, 2 * bigBlind);
            currentPlayer = table.getPlayerIndexByID(player1);
            expect(table.currentPlayer).toBe(currentPlayer);

            table.call(player1);
            currentPlayer = table.getPlayerIndexByID(player2);
            expect(table.currentPlayer).toBe(currentPlayer);

            table.call(player2);
            currentPlayer = table.getPlayerIndexByID(player1);
            expect(table.currentPlayer).toBe(currentPlayer);
        });

        it('should not have a board', () => {
            expect(table.getGame().board.length).toEqual(0);
        });

        it('should set correct bets', () => {
            table.bet(player1, smallBlind);
            table.bet(player2, bigBlind);
            table.bet(player3, bigBlind * 2);

            expect(table.getGame().getBet(0)).toBe(smallBlind);
            expect(table.getGame().getBet(1)).toBe(bigBlind);
            expect(table.getGame().getBet(2)).toBe(bigBlind * 2);
        });


        it('should start a new Round(Flop) after everyone called the blinds', () => {
            expect(table.getRoundType()).toBe(RoundType.Deal);

            table.bet(player1, smallBlind);
            table.bet(player2, bigBlind);
            table.call(player3);
            table.call(player1);

            expect(table.getRoundType()).toBe(RoundType.Flop);
        });

        it('should have the correct amount in the pot after everyone called the blinds', () => {
            table.bet(player1, smallBlind);
            table.bet(player2, bigBlind);
            table.call(player3);
            table.call(player1);

            expect(table.getGame().pot).toEqual(60);
        });

        it('should stay in the same Round after Raise', () => {
            table.bet(player1, smallBlind);
            table.bet(player2, bigBlind);
            table.bet(player3, bigBlind * 2);
            table.call(player1);

            expect(table.getRoundType()).toBe(RoundType.Deal);
        });

        it('should continue to next Round(Flop) after Raise was called', () => {
            table.bet(player1, smallBlind);
            table.bet(player2, bigBlind);
            table.bet(player3, bigBlind * 2);
            table.call(player1);
            table.call(player2);

            expect(table.getRoundType()).toBe(RoundType.Flop);
        });

        it('should stay in Round(Deal) after Re-Raise', () => {
            table.bet(player1, smallBlind);
            table.bet(player2, bigBlind);
            table.bet(player3, bigBlind * 2);
            table.bet(player1, bigBlind * 3);
            table.call(player2);

            expect(table.getRoundType()).toBe(RoundType.Deal);
        });

        it('should continue with Round(Flop) after Re-Raise was called', () => {
            table.bet(player1, smallBlind);
            table.bet(player2, bigBlind);
            table.bet(player3, bigBlind * 2);
            table.bet(player1, bigBlind * 3);
            table.call(player2);
            table.call(player3);

            expect(table.getRoundType()).toBe(RoundType.Flop);
        });

        it('should stay in Round(Deal) after Re-Raise', () => {
            table.bet(player1, smallBlind);
            table.bet(player2, bigBlind);
            table.bet(player3, bigBlind * 2);
            table.bet(player1, bigBlind * 3);
            table.bet(player2, bigBlind * 4);
            table.call(player3);

            expect(table.getRoundType()).toBe(RoundType.Deal);
        });

        it('should continue with Round(Flop) after Re-Raise was called', () => {
            table.bet(player1, smallBlind);
            table.bet(player2, bigBlind);
            table.bet(player3, bigBlind * 2);
            table.bet(player1, bigBlind * 3);
            table.bet(player2, bigBlind * 4);
            table.call(player3);
            table.call(player1);

            expect(table.getRoundType()).toBe(RoundType.Flop);
        });

        describe('Round(Flop)', () => {
            beforeEach(() => {
                // Round(Deal)
                table.bet(player1, smallBlind);
                table.bet(player2, bigBlind);
                table.call(player3);
                table.call(player1);
            });

            it('should have 60 coins in the pot', () => {
                expect(table.getGame().pot).toEqual(60);
            });

            it('should have 60 coins in the pot after checking', () => {
                table.check(player1);
                table.check(player2);
                table.check(player3);
                expect(table.getGame().pot).toEqual(60);
            });

            it('should have 120 coins in the pot after raising', () => {
                table.bet(player1, smallBlind);
                table.bet(player2, bigBlind);
                table.call(player3);
                table.call(player1);
                expect(table.getGame().pot).toEqual(120);
            });

            it('should have 3 cards on the board', () => {
                expect(table.getGame().board.length).toEqual(3);
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

                it('should have 120 coins in the pot', () => {
                    expect(table.getGame().pot).toEqual(120);
                });

                it('should have 120 coins in the pot after checking', () => {
                    table.check(player1);
                    table.check(player2);
                    table.check(player3);
                    expect(table.getGame().pot).toEqual(120);
                });

                it('should have 160 coins in the pot after one folded', () => {
                    table.bet(player1, bigBlind);
                    table.call(player2);
                    table.fold(player3);

                    expect(table.getGame().pot).toEqual(160);
                });

                it('should have 4 cards on the board', () => {
                    expect(table.getGame().board.length).toEqual(4);
                });

                describe('Round(River)', () => {
                    beforeEach(() => {
                        // Round(Turn)
                        table.bet(player1, smallBlind);
                        table.bet(player2, bigBlind);
                        table.call(player3);
                        table.call(player1);
                    });

                    it('should have 180 coins in the pot', () => {
                        expect(table.getGame().pot).toEqual(180);
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
                            if (command.cmd === 'game_ended') {
                                done();
                            }
                        });

                        table.bet(player1, bigBlind);
                        table.call(player2);
                        table.call(player3);
                    }, 1000);

                    it('should have added the pot to the winner after a delay', done => {
                        table.commands$.subscribe((command) => {
                            if (command.cmd === 'game_ended') {
                                const { winners } = command.data;
                                expect(winners[0].chips).toEqual(1160);
                                done();
                            }
                        });


                        table.bet(player1, bigBlind);
                        table.call(player2);
                        table.call(player3);
                    }, 1500);
                });
            });
        });

    });
});
