import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ChipsComponent } from '../chips/chips.component';
import { GameControlsComponent } from '../game-controls/game-controls.component';

import { PlayerComponent } from './player.component';


const mockPlayer = {
    id: '123123',
    name: 'Tester',
    chips: 1000,
    color: '#DAA520',
    allIn: false,
    folded: false,
    disconnected: false
};
describe('PlayerComponent', () => {
    let component: PlayerComponent;
    let fixture: ComponentFixture<PlayerComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PlayerComponent, ChipsComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayerComponent);
        component = fixture.componentInstance;
        component.player = mockPlayer;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
