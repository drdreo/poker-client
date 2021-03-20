import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidepotComponent } from './sidepot.component';

describe('SidepotComponent', () => {
  let component: SidepotComponent;
  let fixture: ComponentFixture<SidepotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SidepotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidepotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
