import { GoogleGenAI, Modality, Part, Type } from "@google/genai";
import { JobDetails, ChangeDetail, TextGenerationResult, FinalAssetsResult } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const base64ToPart = (base64: string): Part => {
    const [header, data] = base64.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1];
    if (!mimeType || !data) {
        throw new Error("Invalid base64 string for image part");
    }
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
};

const parseJsonResponse = <T>(text: string, context: string): T => {
    try {
        let jsonString = '';
        const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        
        if (jsonBlockMatch && jsonBlockMatch[1]) {
            jsonString = jsonBlockMatch[1];
        } else {
            const startIndex = text.indexOf('{');
            const endIndex = text.lastIndexOf('}');
            if (startIndex !== -1 && endIndex > startIndex) {
                jsonString = text.substring(startIndex, endIndex + 1);
            }
        }

        if (jsonString) {
            return JSON.parse(jsonString);
        } else {
            throw new Error(`No parsable JSON object found in the AI response for ${context}.`);
        }
    } catch (e) {
        console.error(`Failed to parse JSON for ${context}. Raw text:`, text, "Error:", e);
        throw new Error(`AI returned an invalid text format during ${context}.`);
    }
};

/**
 * STEP 1: Generates all text-based suggestions by analyzing the resume and job description.
 */
export const generateTextAssets = async (
  resumeImagesBase64: string[],
  jobDetails: JobDetails
): Promise<TextGenerationResult> => {
  const prompt = `
    You are a world-class resume tailoring assistant. Your task is to analyze a user's resume (provided as images) and a job description to produce a highly structured JSON object containing proposed changes.

    **Instructions:**
    1.  **Analyze:** Deeply understand the original resume's content and the key requirements of the job description for "${jobDetails.jobTitle}" at "${jobDetails.companyName}".
    2.  **Generate Supporting Content:** Create a professional cover letter, a concise executive summary of the tailoring strategy, and a list of relevant ATS keywords.
    3.  **Detail All Changes:** For the 'changesMade' field, create an array of objects. Each object must represent a single, specific change you made. It MUST have the following keys:
        *   \`section\`: The specific section of the resume that was changed (e.g., "Summary", "Experience: Lead Architect", "Skills").
        *   \`summary\`: A brief, one-sentence summary of the change you made.
        *   \`originalText\`: The exact, verbatim text from the original resume that was replaced or modified. If you are ADDING a new bullet point or section, this field MUST be an empty string (""). It is CRITICAL that for modifications, this is a perfect, character-for-character transcription of the text on the image.
        *   \`newText\`: The new text you wrote to replace the original, or the new text to add.
        *   \`pageIndex\`: The 0-indexed page number of the resume image where this change should be applied.
    4.  **Format Output:** You MUST return a single, valid JSON object enclosed in a \`\`\`json markdown block. Adhere strictly to the specified format.

    **CRITICAL:** Your output must ONLY be the JSON object in the markdown block. Do not include any other text or explanation.
  `;
  const imageParts = resumeImagesBase64.map(base64ToPart);
  const textPart = { text: prompt };

  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [...imageParts, textPart] }
  });

  const parsedResponse = parseJsonResponse<{
      coverLetter: string;
      executiveSummary: string;
      changesMade: ChangeDetail[];
      atsKeywords: string[];
  }>(response.text, "text asset generation");

  return {
      coverLetter: parsedResponse.coverLetter,
      summary: parsedResponse.executiveSummary,
      changes: parsedResponse.changesMade,
      atsKeywords: parsedResponse.atsKeywords
  };
};

/**
 * STEP 2a: Generates the final, cohesive resume text based on user-approved changes (for UI display).
 */
const generateFinalResumeText = async (
  originalResumeText: string,
  allProposedChanges: ChangeDetail[],
  appliedChanges: ChangeDetail[],
  numPages: number,
): Promise<string[]> => {
    const prompt = `
        You are a resume finalizer. You will be given the full text of an original resume, a list of all possible AI-suggested changes, and a list of the specific changes a user has approved.
        Your task is to generate the complete, final text for the resume, applying ONLY the user-approved changes.

        **Instructions:**
        1.  **Understand Context:** Use the original resume text as the base.
        2.  **Apply Approved Changes:** Integrate the changes from the "User-Approved Changes" list into the base text.
        3.  **Ignore Rejected Changes:** Do not incorporate any changes that are not in the approved list.
        4.  **Ensure Cohesion:** The final text must be professional, well-written, and cohesive, even with some changes being omitted.
        5.  **Format Output:** Return a single JSON object with a key "rewrittenResumeText". The value should be an array of strings, where each string is the full content for one page. The number of strings in the array MUST be exactly ${numPages}.

        **Original Resume Text:**
        ---
        ${originalResumeText}
        ---

        **All Possible AI Changes (for context):**
        ---
        ${JSON.stringify(allProposedChanges, null, 2)}
        ---

        **User-Approved Changes (Apply ONLY these):**
        ---
        ${JSON.stringify(appliedChanges, null, 2)}
        ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] }
    });
    
    const parsed = parseJsonResponse<{ rewrittenResumeText: string[] }>(response.text, "final text synthesis");
    if (!parsed.rewrittenResumeText || parsed.rewrittenResumeText.length !== numPages) {
         throw new Error(`AI final text synthesis mismatch: Expected text for ${numPages} pages, but received text for ${parsed.rewrittenResumeText?.length || 0} pages.`);
    }
    return parsed.rewrittenResumeText;
};

/**
 * STEP 2b: Applies a single, atomic text change to an image.
 */
const applyAtomicChangeToImage = async (
  currentImageStateBase64: string,
  change: ChangeDetail,
  pageNumber: number
): Promise<string> => {
    console.log(`Applying atomic change to page ${pageNumber}: ${change.summary}`);

    const isAddition = !change.originalText || change.originalText.trim() === '';

    const prompt = isAddition 
    ? `
        You are a hyper-precise visual document editor. Your task is to ADD new text to the provided image within a specific section, ensuring it integrates seamlessly with the existing content and style.

        **CRITICAL RULES:**
        1.  **LOCATE SECTION:** Find the section named "${change.section}" on the image.
        2.  **ADD TEXT:** Add the "New Text" provided below into this section. You must intelligently determine the best placement (e.g., as a new bullet point at the end of a list, or as a new paragraph).
        3.  **PERFECT STYLE MATCH:** The new text you render MUST perfectly replicate the font, size, weight, color, leading, and alignment of the other text within the "${change.section}" section.
        4.  **MINIMAL IMPACT & MICRO-REFLOW:** You must NOT change any other part of the image. You must subtly and intelligently reflow the surrounding text and elements *within the same section* to make space for the new content.
        5.  **LEGIBILITY IS MANDATORY:** The generated text MUST be perfectly sharp, clear, and legible.
        6.  **SINGLE IMAGE OUTPUT:** Your response must contain only the final, edited image.

        **Section to Add To:**
        ---
        ${change.section}
        ---

        **New Text to Add:**
        ---
        ${change.newText}
        ---
    `
    : `
        You are a hyper-precise visual document editor. Your task is to perform a single, atomic "find and replace" operation on the text of the provided image. You must be extremely careful to not alter any other part of the document.

        **CRITICAL RULES:**
        1.  **LOCATE TEXT:** Find the specific text on the image that corresponds to the "Original Text" provided below. This is a transcription and might have small errors, so use semantic understanding to find the correct text block. The section is "${change.section}".
        2.  **REPLACE TEXT:** Replace ONLY that located text with the "New Text".
        3.  **PERFECT STYLE MATCH:** The new text you render MUST perfectly replicate the font, size, weight, color, leading, and alignment of the original text it is replacing. It should look like it was always there.
        4.  **MINIMAL IMPACT & MICRO-REFLOW:** This is the most important rule. You must NOT change any other part of the image. If the new text is longer or shorter than the original, you must subtly and intelligently reflow the surrounding text and elements *within the same section* to make it fit naturally. Do not just shrink or stretch the new text. The final result should look professionally typeset.
        5.  **LEGIBILITY IS MANDATORY:** The generated text MUST be perfectly sharp, clear, and legible. Under NO circumstances should you output blurry, distorted, or garbled text. If you cannot perform the replacement cleanly, you must fail safely by returning the original image unmodified.
        6.  **SINGLE IMAGE OUTPUT:** Your response must contain only the final, edited image.

        **Original Text to Find:**
        ---
        ${change.originalText}
        ---

        **New Text to Replace It With:**
        ---
        ${change.newText}
        ---
    `;
    const imagePart = base64ToPart(currentImageStateBase64);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    if (!response.candidates?.[0]?.content?.parts) {
        console.error(`AI returned an invalid response structure for page ${pageNumber}. Raw response:`, JSON.stringify(response, null, 2));
        throw new Error(`AI returned an invalid response structure for page ${pageNumber} for change: "${change.summary}"`);
    }
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            console.log(`Successfully applied change to page ${pageNumber}.`);
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    
    console.error(`AI failed to apply change for page ${pageNumber}. Raw response:`, JSON.stringify(response, null, 2));
    throw new Error(`AI failed to generate a visually updated image for page ${pageNumber} for change: "${change.summary}"`);
};


/**
 * STEP 2 Orchestrator: Runs text synthesis and then sequentially patches images with approved changes.
 */
export const generateFinalAssets = async (
  originalResumeImages: string[],
  originalResumeText: string,
  allProposedChanges: ChangeDetail[],
  appliedChanges: ChangeDetail[],
): Promise<FinalAssetsResult> => {
    // Step 2a: Get the final text content for the UI results page.
    console.log("Step 2a: Synthesizing final resume text for UI display...");
    const finalResumeTextPerPage = await generateFinalResumeText(originalResumeText, allProposedChanges, appliedChanges, originalResumeImages.length);

    // Step 2b: Process each page, applying changes sequentially if they exist.
    console.log("Step 2b: Beginning sequential atomic patching for pages with changes...");
    
    const processPageSequentially = async (originalImage: string, pageIndex: number): Promise<string> => {
        const changesForThisPage = appliedChanges.filter(c => c.pageIndex === pageIndex);

        if (changesForThisPage.length === 0) {
            // No changes, return the original image immediately.
            return originalImage;
        }

        console.log(`Applying ${changesForThisPage.length} sequential changes to page ${pageIndex + 1}...`);

        // Start the chain with the original image for this page.
        let currentImageState = originalImage;
        
        // Loop through each change for the page, awaiting each one.
        // This creates the sequential chain, passing the output of one step as the input to the next.
        for (const change of changesForThisPage) {
            currentImageState = await applyAtomicChangeToImage(currentImageState, change, pageIndex + 1);
        }

        console.log(`Finished applying all changes for page ${pageIndex + 1}.`);
        return currentImageState;
    };

    const finalImagePromises = originalResumeImages.map((img, index) => processPageSequentially(img, index));

    const finalImages = await Promise.all(finalImagePromises);

    if (finalImages.length !== originalResumeImages.length) {
        throw new Error(`Final image count mismatch. Expected ${originalResumeImages.length} images, but only ${finalImages.length} were generated successfully.`);
    }
    
    return { finalImages, finalTexts: finalResumeTextPerPage };
};

export const extractOriginalText = async (resumeImagesBase64: string[]): Promise<string> => {
    const prompt = "Transcribe all the text from the following resume images. Preserve the original line breaks and basic paragraph structure. Output only the plain text content.";
    
    const imageParts = resumeImagesBase64.map(base64ToPart);
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [...imageParts, textPart] }
    });
    
    return response.text;
};