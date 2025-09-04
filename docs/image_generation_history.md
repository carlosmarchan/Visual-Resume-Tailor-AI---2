# Image Generation Strategy History

This document chronicles the evolution of the core image generation logic in the Visual Resume Tailor AI. The primary challenge has always been to replace specific text segments within a user-provided resume image while flawlessly preserving the original's typography, layout, spacing, and overall design fidelity. Several strategies were attempted, each revealing different limitations of generative image models and leading to the more robust solution currently in place.

---

## Attempt 1: The Initial "Find and Replace" Approach (Implicit)

The first and most intuitive approach was to treat the AI as a simple "find and replace" tool for images.

### The Logic

The prompt for the AI was straightforward:

1.  Here is an image of a resume.
2.  Here is a list of changes, each with an "original text" snippet and a "new text" snippet.
3.  For each change, find the `originalText` on the image and replace it with the `newText`.
4.  Ensure the font, style, and color match the surrounding text.
5.  Return the single, fully modified image.

### Why It Failed

This strategy proved to be extremely brittle and was the primary source of the "garbled text" issue.

*   **Transcription Sensitivity:** The process relied on the AI's initial text transcription (`originalText`) being a perfect, character-for-character match with the text on the image. Any minor OCR error (e.g., mistaking an 'l' for a '1') would cause the "find" step to fail, leading the AI to either ignore the instruction or, worse, hallucinate a location and overwrite the wrong part of the image.
*   **Cognitive Overload:** Asking the model to perform multiple, precise, spatially-aware find-and-replace operations simultaneously on a complex document proved to be too cognitively demanding. The model would often conflate instructions, misplace text, or fail to render the text cleanly, resulting in distorted or illegible characters.
*   **Lack of Reflow:** This simple prompt structure did not adequately instruct the AI on how to handle text of different lengths. A shorter `newText` would leave an awkward gap, while a longer one would overflow or be unnaturally compressed.

---

## Attempt 2: The "Full-Page Repaint" Strategy

Recognizing the flaws in the find-and-replace method, the next strategy was to change the task from "editing" to "re-creating".

### The Logic

Instead of providing a list of edits, the AI was given a more holistic task:

1.  Synthesize the complete, final text for an entire resume page *before* involving the image model.
2.  Provide the AI with two primary inputs:
    *   The **original resume image** to be used as a perfect visual template.
    *   The **complete, final block of text** for that page.
3.  The instruction was: "Re-create this page. Use the original image as a perfect reference for all layout, fonts, colors, and spacing, but use this new block of text as the content."

### Why It Failed

While a logical step up, this approach overestimated the model's capabilities as a reliable typesetter.

*   **Layout Brittleness:** AI image models, while excellent at generating creative scenes, struggle with the hyper-precise, grid-based alignment required for a professional document. Columns would be slightly misaligned, margins would drift, and font weights or sizes would have minor, yet noticeable, inconsistencies.
*   **Compounding Errors:** A small error at the top of the page (e.g., incorrect line spacing) would create a cascading effect, throwing off the layout for the rest of the document.
*   **Persistent Garbled Text:** The fundamental problem of rendering sharp, clean, small-font text remained. The AI would still occasionally produce blurry or distorted characters, and because it was repainting the entire page, the problem could appear anywhere, not just in the changed sections.

---

## Attempt 3: "Sequential Atomic Patching" (Current Solution)

This strategy was born from the realization that breaking a complex problem into a series of simple, verifiable steps yields far more reliable results. It's designed to mimic how a human designer would meticulously edit a document: one small change at a time.

### The Logic

1.  **Isolate Changes:** The task is atomized. Instead of handling all changes at once, the AI is only ever asked to perform **one single change** per API call.
2.  **Visual Targeting:** The prompt for each call instructs the AI to *visually locate* the `originalText`, making it resilient to minor transcription errors. It's asked to find text that *looks like* the `originalText` in the specified `section`, rather than relying on a perfect string match.
3.  **Sequential Chaining:** This is the key innovation. For a page with multiple edits, the process is:
    a.  Take the **original image** and apply **Change #1**.
    b.  The **output image** from that operation becomes the **input image** for applying **Change #2**.
    c.  The output from that becomes the input for **Change #3**, and so on.
4.  **Micro-Reflow Command:** The prompt for each atomic operation includes a critical instruction: "subtly and intelligently reflow the surrounding text and elements *within the same section* to make it fit naturally." This gives the AI a clear, constrained directive for handling text of varying lengths.
5.  **Strict Quality Mandate:** The prompt explicitly commands the AI to prioritize legibility, instructing it to fail safely (by returning the original image) rather than producing a garbled result.

### Why It Works

*   **Reduced Cognitive Load:** Each AI task is incredibly simple and focused, dramatically reducing the chance of error or hallucination.
*   **Isolation of Failure:** If one atomic change fails, it doesn't corrupt the entire page. The previous successful changes are still intact.
*   **Stateful Editing:** The sequential process builds upon previous successes, creating a stable foundation for each subsequent edit. It's the closest an AI can get to a stateful editing session.