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

    console.log(winners.map(winner => console.log(winner.hand.descr)));

    return message;
}
