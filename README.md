# QuizBase

A retrieval-locked assistant that searches Quizlet flashcards and returns exact answers. Type a question, get the answer directly from Quizlet — no AI hallucination, no external sources.

## How It Works

1. **You type a question** — Enter any flashcard question in the search box
2. **QuizBase searches Quizlet** — Uses Google Custom Search API to find matching flashcards on quizlet.com
3. **Returns the exact answer** — Extracts and displays only the answer from the Quizlet flashcard

## Features

- 🔒 **Retrieval-locked** — Answers come only from Quizlet, never generated
- ⚡ **Fast search** — Finds flashcard answers in seconds
- 🎯 **Exact matches** — Returns the precise answer from the flashcard
- 🚫 **No hallucination** — If it's not on Quizlet, it says "Not found"

## Setup

### Prerequisites

- Node.js 18+
- Angular CLI
- Google Cloud account (for APIs)

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required: Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Required: Google Custom Search API
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

### Getting API Keys

1. **Gemini API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/apikey)
   - Create an API key

2. **Google Custom Search API**
   - Create a [Programmable Search Engine](https://programmablesearchengine.google.com/)
   - Enable "Search the entire web"
   - Get the Search Engine ID (cx parameter)
   - Enable [Custom Search API](https://console.cloud.google.com/apis/library/customsearch.googleapis.com) in Google Cloud
   - Create an API key in [Credentials](https://console.cloud.google.com/apis/credentials)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open http://localhost:4200 in your browser.

## Tech Stack

- **Frontend**: Angular 20 with Signals
- **Search**: Google Custom Search API
- **AI Extraction**: Gemini 2.0 Flash
- **Styling**: CSS with custom properties

## License

MIT
