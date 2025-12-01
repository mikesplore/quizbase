
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { SearchService } from './core/search';
import { SearchInputComponent } from './shared/search-input/search-input';
import { ResultCardComponent } from './shared/result-card/result-card';

@Component({
  selector: 'app-root',
  imports: [AsyncPipe, SearchInputComponent, ResultCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly searchService = inject(SearchService);

  protected readonly searchResult = this.searchService.searchResult;

  protected onSearch(query: string) {
    this.searchService.setQuery(query);
  }
}
