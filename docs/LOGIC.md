# Visual Resume Tailor AI - Application Logic

## 1. Introduction

This document outlines the complete technical workflow of the "Visual Resume Tailor AI" application. The application's primary goal is to intelligently modify the text of a user's resume to align with a specific job description, while meticulously preserving the original visual design, layout, and typography.

The application is a React-based Single Page Application (SPA) built with TypeScript and styled with Tailwind CSS. The core AI capabilities are powered by the Google Gemini API, specifically using `gemini-2.5-flash` for text-based tasks and `gemini-2.5-flash-image-preview` for visual editing.

The user experience is a guided, multi-step process, which is managed by a state machine in the main `App.tsx` component.

---

## 2. The Application Flow

The application logic is broken down into five distinct stages, moving the user from initial input to final, downloadable assets.

### Step 1: User Input (`InputScreen.tsx`)

1.  **Resume Upload**: The user uploads one or more images of their resume (PNG or JPEG format). The `FileUpload.tsx` component provides a drag-and-drop interface.
2.  **File Conversion**: The `fileToBase64` utility function in `services/geminiService.ts` converts each uploaded image file into a base64-encoded string. This is the required format for including images in a Gemini API request.
3.  **Job Details**: The user fills out a form with the Job Title, Company Name, and the full Job Description they are targeting.
4.  **Initiation**: Upon submission, the `onGenerate` callback is triggered, passing the job details and the array of base64 image strings to the main `App.tsx` component, which then initiates the AI workflow.

### Step 2: AI Text Analysis & Content Generation (`generateTextAssets`)

1.  **State Change**: The application transitions to the `PROCESSING_TEXT` state, displaying an informative loading screen.
2.  **API Call**: The `App.tsx` component calls the `generateTextAssets` function in the `geminiService`. This is the first major interaction with the AI. In parallel, it also calls `extractOriginalText` to get a plain-text version of the user's resume.
3.  **Prompt Construction**: A detailed prompt is sent to the `gemini-2.5-flash` model. This prompt includes:
    *   The base64 resume images.
    *   The job description details.
    *   A highly-structured set of instructions for the AI to act as a professional resume tailor.
    *   A strict requirement for the output to be a single JSON object.
4.  **AI Response (JSON)**: The AI analyzes the inputs and returns a JSON object containing:
    *   `coverLetter`: A fully drafted cover letter.
    *   `executiveSummary`: A high-level summary of the tailoring strategy.
    *   `atsKeywords`: A list of Applicant Tracking System (ATS) keywords identified.
    *   `changesMade`: **(Crucial Output)** An array of `ChangeDetail` objects. Each object represents a specific, atomic change and contains:
        *   `section`: The resume section where the change occurs (e.g., "Experience").
        *   `summary`: A one-sentence description of the change.
        *   `originalText`: A verbatim transcription of the text to be replaced. This is critical for the user's review process.
        *   `newText`: The proposed new text.
        *   `pageIndex`: The 0-indexed page number where the change should occur.
5.  **State Update**: The parsed JSON result and the original transcribed text are saved to the application's state. The app then transitions to the `REFINEMENT` stage.

### Step 3: User Refinement & Approval (`RefinementScreen.tsx`)

1.  **Review Interface**: The UI presents all AI-suggested changes to the user, grouped by section. Each change is displayed in a `ChangeCard` component, showing a clear "before" (`originalText`) and "after" (`newText`) comparison.
2.  **User Control**: The user has full control to approve or reject each individual suggestion using a toggle switch. By default, all changes are pre-approved.
3.  **Cost Estimation**: The interface provides a live, non-binding cost estimate based on how many unique resume pages will require visual regeneration.
4.  **Confirmation**: Once the user is satisfied, they confirm their selections. The `onConfirm` callback sends the final array of *only the user-approved changes* back to `App.tsx` to begin the final, most critical step.

### Step 4: Final Visual Asset Generation (`generateFinalAssets`)

This step is the core of the application's unique functionality and is orchestrated by the `generateFinalAssets` function. It uses a **"Batched Changes per Page"** strategy for efficiency.

1.  **State Change**: The app enters the `PROCESSING_IMAGES` state.
2.  **Orchestration**: `generateFinalAssets` receives the original images, the original text, all proposed changes (for context), and the list of user-approved changes. It then runs two processes in parallel:
    *   **A) Final Text Synthesis**: It calls `generateFinalResumeText`, which asks the AI to create the complete, final plain-text version of the resume by applying only the user-approved changes to the original text. This is used for the "copy-paste" friendly output on the results screen.
    *   **B) Visual Generation**: It begins processing each resume page image.
3.  **Page-by-Page Processing**: The function iterates through each original resume image.
    *   If a page has **no approved changes**, its original image is carried over directly to the final output.
    *   If a page **has one or more approved changes**, the batch editing process begins for that page:
        a.  All approved changes for that specific page are collected into a single array (a "batch").
        b.  The `applyBatchedChangesToImage` function is called, passing the original image for that page and the entire batch of changes.
        c.  **`applyBatchedChangesToImage`**: This function calls the `gemini-2.5-flash-image-preview` model with a specific prompt. The AI is instructed to:
            i.  **Perform all edits** listed in the provided batch.
            ii. **Perfectly match** all visual styles (font, size, color, spacing).
            iii. **Perform a "micro-reflow"** of surrounding content to ensure the new text fits naturally.
            iv. **Prioritize legibility** and output a single, clean image.
        d.  **Retry Logic**: This function includes a retry mechanism. If the AI fails to return a valid or changed image, it will automatically retry the request up to two more times before failing.
4.  **Finalization**: `Promise.all` waits for all pages to complete their processing. The function returns an object containing both the array of final, visually-edited images and the array of final resume text per page.

### Step 5: Displaying Results (`ResultsScreen.tsx`)

1.  **State Change**: The app enters its final `RESULTS` state.
2.  **Asset Display**: The `ResultsScreen` component displays all the generated assets in a clean, tabbed interface:
    *   **Tailored Resume**: A side-by-side view of the original and the final, visually-edited resume images.
    *   **Cover Letter**: The full text of the generated cover letter.
    *   **Applied Changes**: A summary of the changes the user approved.
    *   **Original/New Text**: Plain text versions of the resume content (original and tailored) with a "copy to clipboard" feature for easy use in online application forms.
3.  **Downloads**: The `usePdfGenerator` hook, which utilizes the `jsPDF` library, allows the user to download the tailored resume images and the cover letter as high-quality PDF files.
