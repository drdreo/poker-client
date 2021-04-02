import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogRef } from '@ngneat/dialog';

import { PokerSettingsComponent } from './poker-settings.component';

describe('PokerSettingsComponent', () => {
    let component: PokerSettingsComponent;
    let fixture: ComponentFixture<PokerSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PokerSettingsComponent],
            providers: [
                {
                    provide: DialogRef,
                    useFactory: () => ({
                        close: jasmine.createSpy(),
                        beforeClose: () => {}
                    })
                }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PokerSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
