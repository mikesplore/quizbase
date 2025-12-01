
import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import type { QuizletCard } from './quizlet-card';

@Injectable({
  providedIn: 'root',
})
export class QuizletDataService {
  private readonly quizletData = signal<QuizletCard[]>([
    {
      term: 'Signal',
      definition:
        'A signal is a value that can change over time. When the value of a signal is updated, any components or templates that use it are automatically updated as well.',
    },
    {
      term: 'Standalone Component',
      definition:
        'A standalone component is a type of component that is not part of an NgModule. Standalone components are self-contained and can be used without being declared in a module.',
    },
    {
      term: 'OnPush Change Detection',
      definition:
        'OnPush is a change detection strategy that tells Angular to only check for changes in a component when its inputs have changed or when an event has been fired from the component.',
    },
    {
      term: 'Native Control Flow',
      definition:
        'Native control flow refers to the new @-syntax for control flow in Angular templates, which includes @if, @for, and @switch. This syntax provides a more intuitive and powerful way to handle conditional logic in templates.',
    },
  ]);

  public getQuizletData = this.quizletData.asReadonly();
}
