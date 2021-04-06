import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from '../card/card.component';

import { HandRanksComponent } from './hand-ranks.component';

describe('HandRanksComponent', () => {
    let component: HandRanksComponent;
    let fixture: ComponentFixture<HandRanksComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HandRanksComponent, CardComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HandRanksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
