# Visual Resume Tailor AI: Your One-Click Application Toolkit.

![Header](https://i.imgur.com/8Q9s1Qc.png)

You spent hours crafting the perfect resume in Canva, Figma, or Word. It looks amazing. But now you have to tailor it for every single job application—a tedious, manual process that risks messing up your beautiful layout with every text change.

**Visual Resume Tailor AI is your one-click application toolkit.** It's a sophisticated application that uses AI to generate a complete package for a specific job—a rewritten resume, a tailored cover letter, and ATS keywords—all while leaving your original design pixel-perfect. Stop the copy-paste grind. Start applying faster.

---
<!-- TODO: Add an animated GIF here showing a side-by-side of an original resume and the final, tailored version with text changes highlighted. -->
---

## Key Features

-   **⚡ One-Click Application Package**: Instantly generate a complete set of tailored documents. The AI creates a rewritten resume, a professional cover letter, and a list of relevant ATS keywords.
-   **✨ Perfect Visual Fidelity**: Our core promise. Your resume's fonts, colors, spacing, and layout are meticulously preserved. It looks exactly like you designed it, just with job-winning content.
-   **✅ You're the Editor-in-Chief**: AI is your co-pilot, not the pilot. Review every single suggested change in a clear "before and after" view. You approve or reject edits before the final document is generated. You are always in control.
-   **🚀 Dual-Format Output**: Get the best of both worlds. Download a visually perfect **PDF** for human reviewers, and easily **copy the tailored plain text** for pasting into online application forms (ATS).

---

## How It Works: The "Surgical" AI Editing Strategy

We knew a standard "AI image editor" wouldn't work. They're prone to garbled text and broken layouts. So, we developed a more reliable, three-step process designed for precision and quality.

### Step 1: Intelligent Text Analysis (`gemini-2.5-flash`)

First, we focus only on the words. You upload your resume images and the job description. The AI reads everything and generates a complete package of text-only assets: a tailored cover letter, ATS keywords, and a detailed list of proposed resume edits.

### Step 2: Your Editorial Review

This is the most important step. We present every suggested resume change to you. You see the original text and the new text side-by-side. Using simple toggles, you approve the changes you like and reject the ones you don't. Nothing happens to your visual resume without your explicit permission.

### Step 3: "Sequential Atomic Patching" (`gemini-2.5-flash-image-preview`)

This is our secret sauce. Once you confirm your edits, the visual generation begins. Instead of asking the AI to "re-create" the whole page (which is unreliable), we command it to perform a series of tiny, surgical edits.

For each page, it applies *only the changes you approved*, one by one:

1.  It takes the **original image** and the **first approved change**.
2.  The AI performs a "micro-edit"—finding the exact text and replacing it while perfectly matching the style and reflowing the surrounding content.
3.  The **output image** from this first step becomes the **input image** for the second approved change.
4.  This process repeats, creating a chain where each change is a small, "atomic patch" on top of the last.

This sequential method is like a microscopic graphic designer working at lightning speed. It dramatically reduces errors and ensures the final visual resume meets the highest quality standards.

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