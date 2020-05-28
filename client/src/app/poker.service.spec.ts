import { TestBed } from '@angular/core/testing';

import { PokerService } from './poker.service';

describe('PokerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PokerService = TestBed.get(PokerService);
    expect(service).toBeTruthy();
  });
});
