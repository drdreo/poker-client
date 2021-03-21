import { Component, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from '../../shared/notification.service';
import { FeedMessage } from './feed-message/feed-message.component';

@Component({
    selector: 'app-feed',
    templateUrl: './feed.component.html',
    styleUrls: ['./feed.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedComponent {

    private _messages$ = new BehaviorSubject<FeedMessage[]>([]);
    messages$ = this._messages$.asObservable();

    @ViewChild('scrollContainer') private scrollContainer: ElementRef;

    constructor(private notification: NotificationService) {

        this.notification.newFeedMessage$.subscribe(newMessage => {
            this._messages$.next([...this._messages$.getValue(), newMessage]);

            // fucking CD time issue
            setTimeout(() => {
                this.scrollToBottom();
            }, 10);
        });
    }

    scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight + 21;
        } catch (err) { }
    }

}
