# Visual Resume Tailor AI

![Header](https://i.imgur.com/8Q9s1Qc.png)

A sophisticated AI-powered application that tailors the *content* of a resume to a specific job description while meticulously preserving its *original visual layout and design*. Stop manually editing your beautifully designed resume for every application—let AI handle the text, so you can focus on the opportunity.

## Features

-   **AI-Powered Content Tailoring**: Analyzes your resume and a target job description to rewrite and optimize your experience, skills, and summary.
-   **Visual Fidelity Preservation**: Leverages a multi-modal AI model to replace text directly on your resume image, perfectly matching fonts, colors, spacing, and layout.
-   **Interactive Refinement**: Puts you in control. Review every suggested change side-by-side, and approve or reject edits before the final document is generated.
-   **Comprehensive Application Package**: Generates not just a tailored resume, but also a professional cover letter and a list of relevant ATS (Applicant Tracking System) keywords.
-   **Side-by-Side Comparison**: Clearly view your original resume next to the new, AI-tailored version.
-   **Multiple Download Options**: Download your tailored resume and cover letter as high-quality PDFs. Also, easily copy the plain text of your new resume for online application forms.

---

## How It Works: The "Sequential Atomic Patching" Strategy

This application's core innovation is a robust, multi-step process designed for maximum reliability and visual fidelity. It avoids the common pitfalls of AI image generation (like garbled text or layout shifts) by breaking the complex task of "editing a resume" into a series of simple, verifiable steps.

### Step 1: Text Analysis & Suggestion (`gemini-2.5-flash`)

-   You upload images of your resume and provide the job description.
-   The AI analyzes both inputs and generates a structured JSON object containing:
    1.  A draft of a **cover letter**.
    2.  An **executive summary** of its tailoring strategy.
    3.  A list of **ATS keywords**.
    4.  A detailed list of **proposed changes**, each with the original text, the suggested new text, the resume section, and the page number.
-   Simultaneously, the AI transcribes the full text from your original resume images.

### Step 2: User Refinement & Approval

-   The application presents a user-friendly interface where you can review every single proposed change.
-   Using toggle switches, you approve the changes you like and reject the ones you don't. This gives you complete editorial control.

### Step 3: Visual Generation & Patching (`gemini-2.5-flash-image-preview`)

-   Once you confirm your selections, the visual generation begins.
-   The application processes each page of your resume one by one.
-   For each page, it applies *only the changes you approved* in a strict sequence:
    1.  It takes the **original image** and the **first approved change**.
    2.  It sends them to the AI with a hyper-specific prompt: "Find this exact text and replace it, matching the style perfectly and reflowing the surrounding content if needed."
    3.  The **output image** from this first step becomes the **input image** for the second approved change.
    4.  This process repeats, creating a chain where each change is a small, "atomic patch" on top of the last.
-   This sequential method dramatically reduces AI errors, prevents cognitive overload, and ensures the highest possible quality for the final visual resume.

### Step 4: Final Assets

-   The application presents all the generated assets—the visually tailored resume, the cover letter, and the plain-text versions—for you to review and download.

---

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **AI Engine**: Google Gemini API
    -   **`gemini-2.5-flash`**: Used for all text generation, analysis, and JSON structuring tasks due to its speed and strong instruction-following capabilities.
    -   **`gemini-2.5-flash-image-preview`**: The core multi-modal model used for the "Sequential Atomic Patching" process, enabling precise in-painting and text replacement on the resume images.
-   **PDF Generation**: `jsPDF` for client-side PDF creation.

---

## Getting Started

This is a web-based application designed to run in a modern browser.

### Prerequisites

You must have a valid Google Gemini API key.

### Configuration

The application requires the API key to be available as an environment variable named `API_KEY`.

```
# Example:
API_KEY="AIzaSy..."
```

The application code in `services/geminiService.ts` will automatically pick up this variable. **Do not hardcode your API key in the source code.**

---

## Project Structure

```
/
├── public/
├── src/
│   ├── components/     # Reusable React components (Button, FileUpload, etc.)
│   ├── hooks/          # Custom hooks (usePdfGenerator)
│   ├── screens/        # Top-level components for each application state (HomeScreen, InputScreen, etc.)
│   ├── services/       # Core logic for Gemini API interactions (geminiService.ts)
│   ├── App.tsx         # Main application component, state management
│   ├── index.tsx       # React entry point
│   └── types.ts        # TypeScript type definitions
├── docs/
│   ├── LOGIC.md        # Detailed breakdown of the application workflow.
│   └── image_generation_history.md # Chronicles the evolution of the image generation strategy.
├── index.html
└── README.md
```
