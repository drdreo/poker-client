import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayingIndicatorComponent } from './playing-indicator.component';

describe('PlayingIndicatorComponent', () => {
    let component: PlayingIndicatorComponent;
    let fixture: ComponentFixture<PlayingIndicatorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlayingIndicatorComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayingIndicatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
