import { Winner, PotType } from '@shared/src';

export function formatWinnersMessage(winners: Winner[]): string {
    const messages = [];
    for (const winner of winners) {
        let message = '';
        message = `${ winner.name } won the ${ getPotTypeName(winner.potType) } pot of ${ winner.amount }`;
        if (winner.hand) {
            message += ` with ${ winners[0].hand.descr }`;
        }
        messages.push(message);
    }

    console.log(winners.map(winner => winner.hand?.descr));

    return messages.join('\n');
}


function getPotTypeName(potType: PotType): string {
    switch (potType) {
        case 'main':
            return 'main';
        case 'sidepot':
        default:
            return 'sidepot';
    }
}
