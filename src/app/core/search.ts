import { inject, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { QuizletDataService } from './quizlet-data';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
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

  public readonly searchResult = toObservable(this.query).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap((query) => {
      this.error.set(null);
      // Only set loading to true if we have a non-empty query
      if (query.trim()) {
        this.loading.set(true);
      }
    }),
    switchMap(async (query) => this.search(query)),
    catchError((err: Error) => {
      this.error.set(err.message);
      return of(null);
    }),
    tap(() => this.loading.set(false))
  );

  public readonly searchResultState = toSignal(this.searchResult, { initialValue: null });
  public readonly loadingState = this.loading.asReadonly();
  public readonly errorState = this.error.asReadonly();

  public setQuery(query: string) {
    this.query.set(query);
  }

  private async search(query: string): Promise<QuizletCard | null> {
    if (!query.trim()) {
      return null;
    }

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

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const definition = response.text();

      if (definition.trim() === 'NOT_FOUND') {
        return null;
      }

      return { term: query, definition };
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to get an answer from the AI. Please try again.');
    }
  }
}
