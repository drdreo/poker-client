import { Winner } from '@shared/src';

export function formatWinnersMessage(winners: Winner[]): string {
    let message = '';
    if (winners.length === 1) {
        message = `${ winners[0].name } won the pot of ${ winners[0].amount }`;
        if (winners[0].hand) {
            message += ` with ${ winners[0].hand.descr }`;
        }
    } else {
        const winnerNames = winners.map(winner => winner.name);
        const winnerPots = winners.map(winner => winner.amount);

        const mainPot = winners.filter(winner => winner.potType === 'main');
        if (mainPot.length > 1 && winners.every(winner => winner.potType === 'main')) {
            console.log('Split pot detected!');
            const splitPotWinnerNames = mainPot.map(winner => winner.name);
            message = `${ splitPotWinnerNames.join(' & ') } split the pot for ${ mainPot[0].amount } each`;
        } else {
            message = `${ winnerNames.join(' & ') } won the pots of ${ winnerPots.join(' & ') }`;
        }
    }

    return message;
}


const mockWinners = [
    {
        id: 'ff6c5926-01ab-452c-ad5e-79345dc69fe4',
        name: 'DrDr',
        allIn: false,
        hand: {
            handType: 3,
            handRank: 130,
            value: 12418,
            handName: 'two pairs'
        },
        potType: 'main',
        amount: 80
    },
    {
        id: '0fe31fdf-95f9-41eb-9405-309ff8b96dcd',
        name: 'Test',
        allIn: true,
        hand: {
            handType: 4,
            handRank: 100,
            value: 16484,
            handName: 'three of a kind'
        },
        potType: 'sidepot0',
        amount: 1560
    }
];
