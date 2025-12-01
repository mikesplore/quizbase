import { Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { QuizletCard } from './quizlet-card';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly query = signal('');
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);

  private readonly searchResult$ = toObservable(this.query).pipe(
    debounceTime(400),
    distinctUntilChanged(),
    switchMap(async (query) => {
      if (!query.trim()) {
        return null;
      }

      try {
        this.loading.set(true);
        this.error.set(null);
        return await this.searchQuizlet(query);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Search failed. Please try again.';
        this.error.set(message);
        return null;
      } finally {
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
   * Search Quizlet.com for flashcard answers.
   * Primary: Use Gemini with Google Search grounding
   * Fallback: Use Custom Search API + Gemini extraction
   */
  private async searchQuizlet(query: string): Promise<QuizletCard | null> {
    const geminiKey = environment.geminiApiKey;
    const searchApiKey = environment.googleSearchApiKey;
    const searchEngineId = environment.googleSearchEngineId;

    if (!geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Try Gemini with grounding first
    const groundingResult = await this.searchWithGeminiGrounding(query, geminiKey);
    if (groundingResult) {
      return groundingResult;
    }

    // Fallback to Custom Search if grounding didn't find it
    if (searchApiKey && searchEngineId) {
      return this.searchWithCustomSearch(query, searchApiKey, searchEngineId, geminiKey);
    }

    return null;
  }

  /**
   * Use Google Custom Search API + Gemini extraction
   */
  private async searchWithCustomSearch(
    query: string,
    searchApiKey: string,
    searchEngineId: string,
    geminiKey: string
  ): Promise<QuizletCard | null> {
    const searchStrategies = [
      `"${query}" site:quizlet.com`,
      `${query} site:quizlet.com`,
    ];

    let items: any[] = [];

    for (const searchQuery of searchStrategies) {
      const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
      searchUrl.searchParams.set('key', searchApiKey);
      searchUrl.searchParams.set('cx', searchEngineId);
      searchUrl.searchParams.set('q', searchQuery);
      searchUrl.searchParams.set('num', '10');

      const searchResponse = await fetch(searchUrl.toString());
      if (!searchResponse.ok) continue;

      const searchData = await searchResponse.json();
      items = searchData.items || [];

      if (items.length > 0) break;
    }

    if (items.length === 0) {
      return null;
    }

    const searchContext = items
      .map((item: any, i: number) => {
        let content = `[${i + 1}] ${item.title}\nSnippet: ${item.snippet}`;
        if (item.pagemap?.metatags?.[0]?.['og:description']) {
          content += `\nMore content: ${item.pagemap.metatags[0]['og:description']}`;
        }
        return content;
      })
      .join('\n\n');

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are extracting flashcard answers from Quizlet content.

USER'S QUESTION: "${query}"

QUIZLET FLASHCARD CONTENT:
${searchContext}

TASK: Find the EXACT answer to this question from the Quizlet flashcards above.

RULES:
1. Find the flashcard where this question appears as the term/question
2. Return ONLY the definition/answer from that flashcard - no explanations
3. If it's a multiple choice question, return only the correct answer
4. If the answer is short (single word, abbreviation, phrase), return just that
5. If you cannot find this exact question in the content, respond with: NOT_FOUND

ANSWER:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!answer || answer === 'NOT_FOUND' || answer.toLowerCase().includes('not found')) {
      return null;
    }

    return { term: query, definition: answer };
  }

  /**
   * Use Gemini with Google Search grounding
   */
  private async searchWithGeminiGrounding(
    query: string,
    geminiKey: string
  ): Promise<QuizletCard | null> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Search Google for this Quizlet flashcard question and find the answer:

"${query}" site:quizlet.com

Look for the Quizlet flashcard answer in the search results. Google often shows "Questions & answers" sections from Quizlet with the exact Q&A pairs.

Return ONLY the exact answer/definition from the Quizlet flashcard.
- No explanations
- No "The answer is..."  
- Just the answer text itself
- If it's a short answer (single word, abbreviation, phrase), return just that

If you cannot find a clear Quizlet flashcard answer, respond with exactly: NOT_FOUND`,
                },
              ],
            },
          ],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text || text === 'NOT_FOUND' || text.toLowerCase().includes('not found') || text.toLowerCase().includes('cannot find')) {
      return null;
    }

    return { term: query, definition: text };
  }
}
