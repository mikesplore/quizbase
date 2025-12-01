import { inject, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { QuizletDataService } from './quizlet-data';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { QuizletCard } from './quizlet-card';
import { environment } from '../../environments/environment';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly quizletDataService = inject(QuizletDataService);

  private readonly query = signal('');
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);

  private readonly genAI = new GoogleGenerativeAI(environment.geminiApiKey);

  private readonly searchResult$ = toObservable(this.query).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(async (query) => {
      // If the query is empty or just whitespace, do nothing and return null.
      if (!query.trim()) {
        return null;
      }

      // A real search is happening. Manage the loading and error states.
      try {
        this.loading.set(true);
        this.error.set(null);
        // The search function now only handles the API call itself.
        return await this.search(query);
      } catch (err: any) {
        console.error('Error in search switchMap:', err);
        this.error.set(
          'Failed to get an answer from the AI. Please try again.'
        );
        return null;
      } finally {
        // This GUARANTEES the loading spinner will be turned off after the search completes or fails.
        this.loading.set(false);
      }
    })
  );

  public readonly searchResultState = toSignal(this.searchResult$);
  public readonly loadingState = this.loading.asReadonly();
  public readonly errorState = this.error.asReadonly();

  public setQuery(query: string) {
    this.query.set(query);
  }

  /**
   * Performs the generative AI search. This function is now simpler and only
   * focuses on the core task of interacting with the Google AI API.
   */
  private async search(query: string): Promise<QuizletCard | null> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const quizletData = this.quizletDataService.getQuizletData();
    const prompt = `
      You are a helpful assistant. You are given a question and a set of flashcards.
      Your task is to answer the question using ONLY the information from the flashcards.
      If the answer cannot be found in the flashcards, you MUST respond with the exact text "NOT_FOUND".

      Here are the flashcards:
      ${JSON.stringify(quizletData)}

      Question: ${query}

      Answer:
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const definition = response.text();

    if (definition.trim() === 'NOT_FOUND') {
      return null;
    }

    return { term: query, definition };
  }
}
