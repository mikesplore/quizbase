
import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.html',
  styleUrl: './search-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  public readonly search = output<string>();

  protected onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.search.emit(query);
  }
}
