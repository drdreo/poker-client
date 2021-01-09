import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedMessageComponent } from './feed-message.component';

describe('FeedMessageComponent', () => {
  let component: FeedMessageComponent;
  let fixture: ComponentFixture<FeedMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeedMessageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
