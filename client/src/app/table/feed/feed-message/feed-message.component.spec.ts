import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedMessageComponent, FeedMessage, MessageType } from './feed-message.component';

describe('FeedMessageComponent', () => {
    let component: FeedMessageComponent;
    let fixture: ComponentFixture<FeedMessageComponent>;

    const playMessage: FeedMessage = {
        content: 'Player 1 bet',
        type: MessageType.Played
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FeedMessageComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FeedMessageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        component.message = playMessage;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should show play message', () => {

        component.message = playMessage;
        fixture.detectChanges();

        const messageContainer = fixture.nativeElement.querySelector('.message');

        expect(messageContainer.classList).toContain('message__played');
    });

    it('should show won message', () => {
        const won: FeedMessage = {
            content: 'Player 1 won the pot',
            type: MessageType.Won
        };
        component.message = won;
        fixture.detectChanges();

        const messageContainer = fixture.nativeElement.querySelector('.message');

        expect(messageContainer.classList).toContain('message__won');
    });

    it('should show joined message', () => {
        const won: FeedMessage = {
            content: 'Player 1 joined',
            type: MessageType.Joined
        };
        component.message = won;
        fixture.detectChanges();

        const messageContainer = fixture.nativeElement.querySelector('.message');

        expect(messageContainer.classList).toContain('message__joined');
    });

    it('should show left message', () => {
        const won: FeedMessage = {
            content: 'Player 1 left',
            type: MessageType.Left
        };
        component.message = won;
        fixture.detectChanges();

        const messageContainer = fixture.nativeElement.querySelector('.message');

        expect(messageContainer.classList).toContain('message__left');
    });
});
