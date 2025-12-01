import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchInputComponent } from './shared/search-input/search-input';
import { ResultCardComponent } from './shared/result-card/result-card';
import { SearchService } from './core/search';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, SearchInputComponent, ResultCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly searchService = inject(SearchService);

  public readonly searchResult = this.searchService.searchResultState;
  public readonly isLoading = this.searchService.loadingState;
  public readonly error = this.searchService.errorState;

  public onSearch(query: string): void {
    this.searchService.setQuery(query);
  }
}
