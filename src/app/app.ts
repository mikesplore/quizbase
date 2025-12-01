
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SearchService } from './core/search';
import { SearchInputComponent } from './shared/search-input/search-input';
import { ResultCardComponent } from './shared/result-card/result-card';

@Component({
  selector: 'app-root',
  imports: [SearchInputComponent, ResultCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly searchService = inject(SearchService);

  protected readonly searchResult = this.searchService.searchResultState;
  protected readonly isLoading = this.searchService.loadingState;
  protected readonly error = this.searchService.errorState;
  protected readonly hasSearched = signal(false);

  protected onSearch(query: string) {
    if (query.trim()) {
      this.hasSearched.set(true);
    }
    this.searchService.setQuery(query);
  }
}
