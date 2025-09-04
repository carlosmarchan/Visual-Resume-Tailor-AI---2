# Application Component & Rendering Flow

This document details the component-based architecture of the Visual Resume Tailor AI. It explains how components are rendered and interact with each other as the user progresses through the application's core workflow. The entire application is designed as a self-contained module, orchestrated by a central state machine.

---

## 1. Core Orchestrator: `App.tsx`

The `App.tsx` component is the brain of the application. It acts as a central controller and state machine, managing the application's current state, holding all the data, and deciding which primary "screen" component to render at any given time.

### State Management

-   **`appState`**: The most critical piece of state, an `AppState` enum (`HOME`, `INPUT`, `PROCESSING_TEXT`, etc.). It dictates the entire UI.
-   **Data State**: `jobDetails`, `resumeImages`, `textAssets`, `originalResumeText`, and `generatedAssets` hold the data as it's created and passed through the workflow.
-   **Callbacks**: `App.tsx` defines the core logic functions (`handleStart`, `handleInitialGenerate`, `handleRefinement`) and passes them down as props to the screen components.

### Rendering Logic

The `renderContent()` function within `App.tsx` is a simple `switch` statement based on the `appState`. It dynamically renders the appropriate screen component for the current stage of the user journey.

```tsx
// Simplified logic from App.tsx
const renderContent = () => {
  switch (appState) {
    case AppState.HOME:
      return <HomeScreen onStart={...} />;
    case AppState.INPUT:
      return <InputScreen onGenerate={...} />;
    // ... and so on for other states
  }
};
```

The `<Header />` component is rendered outside this switch, so it remains persistent across all screens except for the `HOME` state.

---

## 2. Component Flow by UX Stage

The user's journey is linear, progressing through the states defined in the `AppState` enum. Each state corresponds to a primary screen component.

### Stage 1: Home (`AppState.HOME`)

-   **Primary Component**: `screens/HomeScreen.tsx`
-   **Sub-components**: `components/Button.tsx`
-   **Flow**:
    1.  `App.tsx`'s `appState` is initially `HOME`.
    2.  `renderContent()` returns `<HomeScreen />`.
    3.  The user sees the marketing copy and a call-to-action button.
    4.  Clicking the "Create New..." `<Button />` triggers the `onStart` prop, which is the `handleStart` function in `App.tsx`.
    5.  `handleStart` resets all application data and sets `appState` to `INPUT`. The UI re-renders to show the Input screen.

### Stage 2: Input (`AppState.INPUT`)

-   **Primary Component**: `screens/InputScreen.tsx`
-   **Sub-components**: `components/FileUpload.tsx`, `components/Button.tsx`
-   **Flow**:
    1.  `renderContent()` returns `<InputScreen />`. It receives any pre-existing data (if the user came back from an error) and the `onGenerate` callback.
    2.  The `<FileUpload />` component handles its own internal state for UI effects like drag-over styles. When files are selected, it converts them to base64 and calls the `onFilesChange` prop to lift the state up to `<InputScreen />`.
    3.  The user fills out the form fields. All form data state is managed within `<InputScreen />`.
    4.  When the form is valid, the "Generate" `<Button />` is enabled. Clicking it calls `handleSubmit`.
    5.  `handleSubmit` packages the state (`jobDetails`, `resumeImages`) and calls the `onGenerate` prop (`handleInitialGenerate` in `App.tsx`).
    6.  `App.tsx` sets `appState` to `PROCESSING_TEXT`, triggering the next re-render.

### Stage 3 & 5: Processing (`AppState.PROCESSING_TEXT` & `PROCESSING_IMAGES`)

-   **Primary Component**: `screens/ProcessingScreen.tsx`
-   **Sub-components**: `components/LoadingSpinner.tsx`
-   **Flow**:
    1.  `renderContent()` returns `<ProcessingScreen />`.
    2.  It receives a `phase` prop (`'text'` or `'image'`) which determines which set of loading messages to display.
    3.  The component cycles through an array of messages to keep the user engaged while the async API calls in `App.tsx` are pending.
    4.  Once the API call in `App.tsx` resolves, the `appState` is updated, and the UI transitions to the next screen.

### Stage 4: Refinement (`AppState.REFINEMENT`)

-   **Primary Component**: `screens/RefinementScreen.tsx`
-   **Sub-components**: `ChangeCard` (internal), `components/Button.tsx`
-   **Flow**:
    1.  `renderContent()` returns `<RefinementScreen />`, passing down the `textAssets` generated in the previous step and the `onConfirm` callback.
    2.  The screen maps over `textAssets.changes` and renders a `ChangeCard` for each.
    3.  State for which changes are toggled on/off (`appliedChangesMap`) is managed entirely within `<RefinementScreen />`.
    4.  The user interacts with the toggles to make their selections. The summary bar at the bottom re-calculates based on the `appliedChangesMap` state.
    5.  Clicking the "Generate Visual Resume" `<Button />` calls `handleSubmit`, which filters the list of changes based on the state map and passes this refined list to the `onConfirm` prop (`handleRefinement` in `App.tsx`).
    6.  `App.tsx` sets `appState` to `PROCESSING_IMAGES`.

### Stage 6: Results (`AppState.RESULTS`)

-   **Primary Component**: `screens/ResultsScreen.tsx`
-   **Sub-components**: `TabButton` (internal), `AppliedChangeCard` (internal), `components/Button.tsx`
-   **Hooks**: `hooks/usePdfGenerator.ts`
-   **Flow**:
    1.  `renderContent()` returns `<ResultsScreen />`, passing the final `generatedAssets` and other relevant data.
    2.  The screen manages its own local state for the `activeTab`.
    3.  Clicking a `<TabButton />` updates this local state, causing the content area to re-render with the appropriate view (e.g., the resume comparison, the cover letter text).
    4.  Download buttons use functions provided by the `usePdfGenerator` hook to create and save PDF files on the client-side.

---

## 3. Modularity for Future Use

This entire application flow is encapsulated and can be easily wrapped into a single, reusable module.

-   **Entry Point**: The `<App />` component is the single entry point.
-   **Configuration**: It is configured via environment variables (`API_KEY`), requiring no direct props for setup.
-   **Self-Contained Navigation**: The state-machine-based rendering means navigation is entirely self-managed.
-   **Embedding**: To place this application inside another layout, a developer would simply need to render the `<App />` component. No external routing or state management is required. All necessary assets (components, hooks, services) are self-contained within the `src` directory.
