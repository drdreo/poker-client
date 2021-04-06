import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { ToggleComponent } from '../../shared/toggle/toggle.component';

import { PokerSettingsComponent } from './poker-settings.component';

describe('PokerSettingsComponent', () => {
    let component: PokerSettingsComponent;
    let fixture: ComponentFixture<PokerSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PokerSettingsComponent, ToggleComponent],
            imports: [ReactiveFormsModule],
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
