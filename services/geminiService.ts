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
 * STEP 2b: Applies a batch of changes to a single image with a retry mechanism.
 */
const applyBatchedChangesToImage = async (
    originalImageBase64: string,
    changes: ChangeDetail[],
    pageNumber: number,
    maxRetries: number = 2
): Promise<string> => {
    const prompt = `
        You are a hyper-precise visual document editor. Your task is to perform a series of "find and replace" and "add text" operations on the provided image. You must be extremely careful to not alter any other part of the document.

        **CRITICAL RULES:**
        1.  **PERFORM ALL EDITS:** Apply every single edit listed in the "List of Changes" below. If a change has an empty "originalText", it is an ADDITION. Otherwise, it is a REPLACEMENT.
        2.  **PERFECT STYLE MATCH:** For every change, the new text you render MUST perfectly replicate the font, size, weight, color, leading, and alignment of the original text or the surrounding text in that section.
        3.  **MINIMAL IMPACT & INTELLIGENT REFLOW:** This is the most important rule. You must NOT change any other part of the image not specified in the edits. For each change, you must subtly and intelligently reflow the surrounding text and elements *within the same section* to make it fit naturally. The final result should look professionally typeset.
        4.  **LEGIBILITY IS MANDATORY:** The generated text MUST be perfectly sharp, clear, and legible. Under NO circumstances should you output blurry, distorted, or garbled text.
        5.  **SINGLE IMAGE OUTPUT:** Your response must contain only the final, edited image with all changes applied.

        **List of Changes to Apply:**
        ---
        ${JSON.stringify(changes, null, 2)}
        ---
    `;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
            console.warn(`Retrying page ${pageNumber} generation, attempt ${attempt + 1}/${maxRetries + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } else {
            console.log(`Generating page ${pageNumber} with ${changes.length} changes, attempt 1/${maxRetries + 1}.`);
        }

        const imagePart = base64ToPart(originalImageBase64);
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        if (!response.candidates?.[0]?.content?.parts) {
            console.warn(`Attempt ${attempt + 1}: AI returned invalid response structure for page ${pageNumber}. Continuing to next attempt.`);
            continue;
        }
        
        const imagePartFound = response.candidates[0].content.parts.find(p => p.inlineData);

        if (imagePartFound && imagePartFound.inlineData) {
            const newImageBase64 = `data:${imagePartFound.inlineData.mimeType};base64,${imagePartFound.inlineData.data}`;
            
            // A simple check to see if the image was modified.
            // This isn't perfect, but it's a good heuristic to detect a no-op from the model.
            if (newImageBase64 !== originalImageBase64) {
                console.log(`Successfully generated page ${pageNumber} on attempt ${attempt + 1}.`);
                return newImageBase64;
            } else {
                console.warn(`Attempt ${attempt + 1}: AI returned an identical (unchanged) image for page ${pageNumber}.`);
            }
        } else {
            console.warn(`Attempt ${attempt + 1}: AI response for page ${pageNumber} did not contain an image part.`);
        }
    }
    
    console.error(`AI failed to generate page ${pageNumber} after ${maxRetries + 1} attempts.`);
    throw new Error(`AI failed to generate a visually updated image for page ${pageNumber} after multiple retries.`);
};


/**
 * STEP 2 Orchestrator: Runs text synthesis and then generates final images by applying changes on a per-page basis.
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

    // Step 2b: Process each page, applying a batch of changes if they exist.
    console.log("Step 2b: Beginning batched image generation for pages with changes...");
    
    const processPage = async (originalImage: string, pageIndex: number): Promise<string> => {
        const changesForThisPage = appliedChanges.filter(c => c.pageIndex === pageIndex);

        if (changesForThisPage.length === 0) {
            // No changes, return the original image immediately.
            console.log(`Page ${pageIndex + 1} has no changes. Using original image.`);
            return originalImage;
        }
        
        return applyBatchedChangesToImage(originalImage, changesForThisPage, pageIndex + 1);
    };

    const finalImagePromises = originalResumeImages.map((img, index) => processPage(img, index));

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