import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export enum MessageType {
    Info,
    Error,
    Played,
    Won,
    Joined,
    Left,
    Bankrupt
}

export interface FeedMessage {
    type: MessageType;
    content: string;
}

@Component({
    selector: 'feed-message',
    templateUrl: './feed-message.component.html',
    styleUrls: ['./feed-message.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedMessageComponent {

    messageTypes = MessageType;

    @Input() message: FeedMessage;
}
