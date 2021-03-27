import { trigger, transition, style, query, animateChild, animate, group } from '@angular/animations';

export const slideInAnimation =
    trigger('routeAnimations', [
        transition('HomePage <=> TablePage', [
            style({ position: 'relative' }),
            query(':enter, :leave', [
                style({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%'
                })
            ]),
            query(':enter', [
                style({ left: '100%' })
            ]),
            query(':leave', animateChild()),
            group([
                query(':leave', [
                    animate('300ms ease-out', style({ left: '-100%' }))
                ]),
                query(':enter', [
                    animate('300ms ease-out', style({ left: 0 }))
                ])
            ]),
            query(':enter', animateChild())
        ])
    ]);


export const fadeInSlideOutAnimation = trigger('fadeInSlideOut', [
    transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-out', style({ opacity: 1}))
    ]),
    transition(':leave', [
        animate('500ms ease-out', style({ opacity: 0, transform: 'translateX(-200%)' }))
    ])
]);


export const cardFadeInAnimation = trigger('cardsFadeIn', [
    transition(':enter', [
        style({ opacity: 0,  transform: 'translateX(-20px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)'}))
    ]),
    transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0 }))
    ])
]);

export const controlsFadeAnimation = trigger('controlsFadeSlideInOut', [
    transition(':enter', [
        style({ opacity: 0,  transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)'}))
    ]),
    transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateY(100%)' }))
    ])
]);

export const sidePotSlideAnimation = trigger('fadeSlideInOut', [
    transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-200%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
    ]),
    transition(':leave', [
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateX(-200%)' }))
    ])
]);


export const fadeInOutAnimation = trigger('fadeInOut', [
    transition(':enter', [
        style({ opacity: 0}),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1}))
    ]),
    transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0 }))
    ])
]);
