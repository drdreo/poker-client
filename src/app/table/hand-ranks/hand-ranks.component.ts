import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'poker-hand-ranks',
    templateUrl: './hand-ranks.component.html',
    styleUrls: ['./hand-ranks.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HandRanksComponent implements OnInit {


    hands = [
        {
            name: 'Royal Flush',
            description: '5 same-suit consecutive cards, lead by Ace',
            cards: [
                { value: '10', figure: 'S' },
                { value: 'J', figure: 'S' },
                { value: 'Q', figure: 'S' },
                { value: 'K', figure: 'S' },
                { value: 'A', figure: 'S' }
            ]
        },
        {
            name: 'Straight Flush',
            description: '5 consecutive cards of the same suit',
            cards: [
                { value: '4', figure: 'H' },
                { value: '5', figure: 'H' },
                { value: '6', figure: 'H' },
                { value: '7', figure: 'H' },
                { value: '8', figure: 'H' }
            ]
        },
        {
            name: 'Four of a Kind',
            description: '4 cards of the same number',
            cards: [
                { value: '3', figure: 'S' },
                { value: '3', figure: 'D' },
                { value: '3', figure: 'C' },
                { value: '3', figure: 'H' },
                { value: '6', figure: 'H', inactive: true }
            ]
        },
        {
            name: 'Full House',
            description: '3 cards of the same number & a pair',
            cards: [
                { value: '6', figure: 'S' },
                { value: '6', figure: 'D' },
                { value: 'K', figure: 'C' },
                { value: 'K', figure: 'H' },
                { value: 'K', figure: 'H' }
            ]
        },
        {
            name: 'Flush',
            description: '5 cards of the same suit',
            cards: [
                { value: '2', figure: 'D' },
                { value: '6', figure: 'D' },
                { value: '9', figure: 'D' },
                { value: 'Q', figure: 'D' },
                { value: 'K', figure: 'D' }
            ]
        },
        {
            name: 'Straight',
            description: '5 consecutive cards of any suit',
            cards: [
                { value: '2', figure: 'D' },
                { value: '3', figure: 'D' },
                { value: '4', figure: 'S' },
                { value: '5', figure: 'H' },
                { value: '6', figure: 'C' }
            ]
        },
        {
            name: 'Three of a Kind',
            description: '3 cards of the same number',
            cards: [
                { value: '3', figure: 'S' },
                { value: '3', figure: 'D' },
                { value: '3', figure: 'C' },
                { value: '2', figure: 'H', inactive: true },
                { value: '6', figure: 'H', inactive: true }
            ]
        },
        {
            name: 'Two Pairs',
            description: 'Two sets of 2 cards of the same number',
            cards: [
                { value: '6', figure: 'S' },
                { value: '6', figure: 'D' },
                { value: '9', figure: 'C' },
                { value: '9', figure: 'H' },
                { value: '4', figure: 'H', inactive: true }
            ]
        },
        {
            name: 'One Pair',
            description: '2 cards of the same number',
            cards: [
                { value: '6', figure: 'S' },
                { value: '6', figure: 'D' },
                { value: '3', figure: 'C', inactive: true },
                { value: '9', figure: 'H', inactive: true },
                { value: 'A', figure: 'H', inactive: true }
            ]
        },
        {
            name: 'High Card',
            description: 'The highest card wins',
            cards: [
                { value: 'A', figure: 'S' },
                { value: '6', figure: 'D', inactive: true },
                { value: '3', figure: 'C', inactive: true },
                { value: '9', figure: 'H', inactive: true },
                { value: 'Q', figure: 'H', inactive: true }
            ]
        }
    ];

    constructor() { }

    ngOnInit(): void {
    }

}
