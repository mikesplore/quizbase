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
      } catch (err: any) {
        console.error('Search error:', err);
        this.error.set('Search failed. Please try again.');
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
   * Primary: Use Gemini with Google Search grounding (can see Q&A snippets)
   * Fallback: Use Custom Search API + page fetching
   */
  private async searchQuizlet(query: string): Promise<QuizletCard | null> {
    const geminiKey = environment.geminiApiKey;
    const searchApiKey = environment.googleSearchApiKey;
    const searchEngineId = environment.googleSearchEngineId;

    if (!geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Try Gemini with grounding first - it can see Google's Q&A snippets
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
   * Use Google Custom Search API (restricted to quizlet.com) + Gemini extraction
   */
  private async searchWithCustomSearch(
    query: string,
    searchApiKey: string,
    searchEngineId: string,
    geminiKey: string
  ): Promise<QuizletCard | null> {
    // Try multiple search strategies for better coverage
    // Add site:quizlet.com to ensure results are from Quizlet even if PSE has indexing issues
    const searchStrategies = [
      `"${query}" site:quizlet.com`,  // Exact phrase + site restriction
      `${query} site:quizlet.com`,    // Natural query + site restriction
    ];

    let items: any[] = [];

    for (const searchQuery of searchStrategies) {
      const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
      searchUrl.searchParams.set('key', searchApiKey);
      searchUrl.searchParams.set('cx', searchEngineId);
      searchUrl.searchParams.set('q', searchQuery);
      searchUrl.searchParams.set('num', '10');

      console.log('Custom Search query:', searchQuery);

      const searchResponse = await fetch(searchUrl.toString());
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Custom Search API error:', errorText);
        continue; // Try next strategy
      }

      const searchData = await searchResponse.json();
      items = searchData.items || [];

      console.log('Custom Search results:', items.length, 'items found');

      if (items.length > 0) {
        console.log('Search results:', JSON.stringify(items.slice(0, 2), null, 2));
        break; // Found results, stop trying
      }
    }

    if (items.length === 0) {
      console.log('No results from any search strategy');
      return null;
    }

    // Use search snippets and metadata to build context for Gemini
    const searchContext = items
      .map((item: any, i: number) => {
        let content = `[${i + 1}] ${item.title}\nSnippet: ${item.snippet}`;
        // Include og:description which often has more flashcard content
        if (item.pagemap?.metatags?.[0]?.['og:description']) {
          content += `\nMore content: ${item.pagemap.metatags[0]['og:description']}`;
        }
        return content;
      })
      .join('\n\n');

    // Step 2: Use Gemini to extract the exact answer
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

    console.log('Gemini extracted answer:', answer);

    if (!answer || answer === 'NOT_FOUND' || answer.toLowerCase().includes('not found')) {
      return null;
    }

    return { term: query, definition: answer };
  }

  /**
   * Use Gemini with Google Search grounding - can see Q&A snippets from Google
   */
  private async searchWithGeminiGrounding(
    query: string,
    geminiKey: string
  ): Promise<QuizletCard | null> {
    console.log('Trying Gemini grounding search...');
    
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
      console.error('Gemini grounding API error:', response.status);
      return null; // Don't throw, let it fall back to Custom Search
    }

    const data = await response.json();
    console.log('Gemini grounding response received');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log('Gemini grounding extracted:', text);

    if (!text || text === 'NOT_FOUND' || text.toLowerCase().includes('not found') || text.toLowerCase().includes('cannot find')) {
      return null;
    }

    if (!text || text === 'NOT_FOUND' || text.toLowerCase().includes('not found')) {
      return null;
    }

    return { term: query, definition: text };
  }

  /**
   * Fetch actual content from Quizlet pages to get flashcard data
   */
  private async fetchQuizletPages(items: any[]): Promise<string[]> {
    const contents: string[] = [];

    for (const item of items) {
      try {
        const url = item.link;
        if (!url || !url.includes('quizlet.com')) continue;

        console.log('Fetching Quizlet page:', url);

        // Use a CORS proxy or fetch directly (may need server-side for production)
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; QuizBase/1.0)',
          },
        });

        if (!response.ok) continue;

        const html = await response.text();

        // Extract flashcard data from the page
        // Quizlet stores flashcard data in JSON within the page
        const flashcardData = this.extractFlashcardsFromHtml(html);
        
        if (flashcardData) {
          contents.push(flashcardData);
          console.log('Extracted flashcard content from:', url);
        }
      } catch (err) {
        console.warn('Failed to fetch Quizlet page:', item.link, err);
      }
    }

    return contents;
  }

  /**
   * Extract flashcard terms and definitions from Quizlet HTML
   */
  private extractFlashcardsFromHtml(html: string): string | null {
    try {
      // Quizlet embeds flashcard data in various formats
      // Try to find JSON data in script tags
      
      // Pattern 1: Look for window.__NEXT_DATA__ (newer Quizlet)
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextDataMatch) {
        const data = JSON.parse(nextDataMatch[1]);
        const cards = this.extractCardsFromNextData(data);
        if (cards) return cards;
      }

      // Pattern 2: Look for Quizlet.setPageData or similar
      const setPageDataMatch = html.match(/Quizlet\.setPageData\(([\s\S]*?)\);/);
      if (setPageDataMatch) {
        const data = JSON.parse(setPageDataMatch[1]);
        const cards = this.extractCardsFromPageData(data);
        if (cards) return cards;
      }

      // Pattern 3: Extract from visible text (fallback)
      // Look for term-definition patterns in the HTML
      const termMatches = html.matchAll(/<span class="[^"]*TermText[^"]*"[^>]*>([\s\S]*?)<\/span>/g);
      const terms: string[] = [];
      for (const match of termMatches) {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text) terms.push(text);
      }

      if (terms.length >= 2) {
        // Pair terms as question-answer
        let result = '';
        for (let i = 0; i < terms.length - 1; i += 2) {
          result += `Q: ${terms[i]}\nA: ${terms[i + 1]}\n\n`;
        }
        return result;
      }

      return null;
    } catch (err) {
      console.warn('Failed to extract flashcards from HTML:', err);
      return null;
    }
  }

  private extractCardsFromNextData(data: any): string | null {
    try {
      // Navigate the NEXT_DATA structure to find flashcards
      const studiableItems = data?.props?.pageProps?.dehydratedState?.queries
        ?.find((q: any) => q.state?.data?.studiableItems)?.state?.data?.studiableItems;
      
      if (studiableItems && Array.isArray(studiableItems)) {
        return studiableItems
          .map((item: any) => `Q: ${item.cardSides?.[0]?.media?.[0]?.plainText || ''}\nA: ${item.cardSides?.[1]?.media?.[0]?.plainText || ''}`)
          .join('\n\n');
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractCardsFromPageData(data: any): string | null {
    try {
      const terms = data?.termIdToTermsMap || data?.terms;
      if (terms && typeof terms === 'object') {
        return Object.values(terms)
          .map((term: any) => `Q: ${term.word || term.term || ''}\nA: ${term.definition || ''}`)
          .join('\n\n');
      }
      return null;
    } catch {
      return null;
    }
  }
}
