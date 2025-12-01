
# Project Blueprint: Retrieval-Locked Quizlet Assistant

## 1. Overview

This project is a retrieval-locked AI assistant. It is designed to answer questions based *only* on a specific, curated dataset derived from Quizlet flashcard sets. The system is explicitly constrained to prevent it from accessing external information, using open-domain search, or generating answers that cannot be directly substantiated by the provided data. If the information is not present in the dataset, the assistant will state that.

## 2. Style, Design, and Features

### Core Functionality
- **Sealed-World Retrieval:** The assistant's knowledge is strictly limited to the ingested Quizlet data.
- **Source-Bound Answers:** Every answer is generated directly from the retrieved text chunks.
- **"Not Found" State:** The system clearly indicates when an answer is not available in the dataset.

### Visual Design
- **Theme:** Modern, clean, and academic.
- **Color Palette:** A primary palette of deep blues and whites, with a vibrant accent color for interactive elements like buttons and highlights.
- **Typography:** Clear, legible sans-serif fonts (e.g., Inter, Lato) for readability.
- **Layout:** A centered, single-column layout on desktop, which adapts smoothly to a single-column view on mobile.
- **UI Components:**
    - **Search Bar:** A prominent, clean input field with a clear "Search" button.
    - **Result Display:** Answers are presented in a clean card format, visually separating them from the rest of the UI.
    - **Loading/Empty States:** The UI will include states for when the app is waiting for an answer or when no results are found.

### Architecture
- **Framework:** Angular (latest version)
- **Components:** Standalone, OnPush change detection.
- **State Management:** Signals for reactive component-level state.
- **Control Flow:** Native `@` syntax (`@if`, `@for`).
- **Styling:** Modern, native CSS.
- **API Integration:** Google Generative AI SDK for Gemini.

## 3. Completed Work

### Phase 1: Project Setup & Core Service
- **Created Core Data Structures:** Defined a `QuizletCard` interface and a `QuizletDataService` to provide mock data.
- **Developed the Search Service:** Created a `SearchService` to handle the core retrieval logic.
- **Built the Main Application Component:** Created the main `app.component` with basic structure and logic.
- **Applied Initial Styling:** Added CSS for a clean, modern aesthetic.

### Phase 2: UI/UX Refinement & Componentization
- **Componentization:** Broke down the UI into a `SearchInputComponent` and a `ResultCardComponent`.
- **Stateful UI:** Implemented loading and error states in the `SearchService` and exposed them as signals.
- **Improved Feedback:** Updated the `AppComponent` to display loading spinners, error messages, and a "No results" state.

### Phase 3: Real-time Search with RxJS
- **Efficient Searching:** Added `debounceTime` to the search pipeline to trigger searches only when the user stops typing.
- **Robustness:** Used `switchMap` to ensure only the latest search request is processed, canceling any pending requests.

### Phase 4: Gemini API Integration
- **Installed SDK:** Added the `@google/generative-ai` package to the project.
- **Implemented Generative Search:** Modified the `SearchService` to call the `gemini-pro` model.
- **Enforced Retrieval-Lock:** Engineered the prompt to instruct the AI to answer *only* from the provided Quizlet data and to respond appropriately if the information is not available.
- **Handled Errors:** Implemented error handling for the API calls.

## 4. Next Steps

The core application is fully functional. Here are some potential next steps we could take:

*   **Phase 5: Streaming Responses:** Instead of waiting for the full answer, we can stream the response from the Gemini API token by token. This makes the application feel much more responsive and "live."
*   **Phase 6: Advanced Styling & Animations:** We can further polish the user interface with more advanced CSS, add subtle animations for state transitions, and enhance the overall visual appeal.
*   **Phase 7: Deployment:** We can prepare the application for production and deploy it to a hosting service like Firebase Hosting so you can share it with others.

What would you like to do next? Please choose from the options above, or suggest something else! 