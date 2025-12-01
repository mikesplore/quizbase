
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { QuizletCard } from '../../core/quizlet-card';

@Component({
  selector: 'app-result-card',
  templateUrl: './result-card.html',
  styleUrl: './result-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultCardComponent {
  public readonly result = input.required<QuizletCard>();
}
