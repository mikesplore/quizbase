
import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  imports: [FormsModule],
  templateUrl: './search-input.html',
  styleUrl: './search-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  public readonly search = output<string>();
  protected readonly query = signal('');

  protected onSubmit(event: Event) {
    event.preventDefault();
    const q = this.query().trim();
    if (q) {
      this.search.emit(q);
    }
  }

  protected onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
  }
}
