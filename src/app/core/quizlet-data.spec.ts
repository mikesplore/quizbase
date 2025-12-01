import { TestBed } from '@angular/core/testing';

import { QuizletData } from './quizlet-data';

describe('QuizletData', () => {
  let service: QuizletData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuizletData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
