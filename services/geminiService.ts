import { GoogleGenAI, Modality, Part, Type } from "@google/genai";
import { GeneratedAssets, JobDetails, ChangeDetail } from "../types";

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

// Type for the response from the first, text-focused AI call
type TextAssetsResponse = {
  rewrittenResumeText: string[];
  coverLetter: string;
  executiveSummary: string;
  changesMade: ChangeDetail[];
  atsKeywords: string[];
}

/**
 * STEP 1: Generates all text-based assets by analyzing the resume and job description.
 */
const generateTextAssets = async (
  resumeImagesBase64: string[],
  jobDetails: JobDetails
): Promise<TextAssetsResponse> => {
  const prompt = `
    You are a world-class resume tailoring assistant. Your task is to analyze a user's resume (provided as images) and a job description to produce a highly structured JSON object.

    **Instructions:**
    1.  **Analyze:** Deeply understand the original resume's content and the key requirements of the job description for "${jobDetails.jobTitle}" at "${jobDetails.companyName}".
    2.  **Generate Rewritten Resume Text:** Rewrite the entire resume content to be perfectly tailored for the job. This text MUST be broken down into an array of strings, where each string corresponds to the content for a single page. The number of strings MUST exactly match the number of resume images provided (${resumeImagesBase64.length}).
    3.  **Generate Supporting Content:** Create a professional cover letter, a concise executive summary of the tailoring strategy, and a list of relevant ATS keywords.
    4.  **Detail All Changes:** For the 'changesMade' field, create an array of objects. Each object must represent a single, specific change you made. It MUST have the following keys:
        *   \`section\`: The specific section of the resume that was changed (e.g., "Summary", "Experience: Lead Architect", "Skills").
        *   \`summary\`: A brief, one-sentence summary of the change you made.
        *   \`originalText\`: The exact text from the original resume that was replaced or modified.
        *   \`newText\`: The new text you wrote to replace the original.
    5.  **Format Output:** You MUST return a single, valid JSON object enclosed in a \`\`\`json markdown block. Adhere strictly to the specified format.

    **CRITICAL:** Your output must ONLY be the JSON object in the markdown block. Do not include any other text or explanation.

    **Example JSON format:**
    \`\`\`json
    {
      "rewrittenResumeText": [
        "Page 1: John Doe...",
        "Page 2: Professional Experience..."
      ],
      "executiveSummary": "The resume was strategically updated to highlight project management skills...",
      "changesMade": [
        {
          "section": "Summary",
          "summary": "Rewrote the summary to align with the Product Manager role's focus on B2B SaaS.",
          "originalText": "Experienced professional with a background in software.",
          "newText": "Visionary Product Manager with 5+ years of experience in the B2B SaaS space..."
        }
      ],
      "atsKeywords": ["Product Roadmap", "Agile", "Data Analysis"],
      "coverLetter": "Dear Hiring Manager,..."
    }
    \`\`\`

    **Job Description:**
    ---
    ${jobDetails.jobDescription}
    ---
  `;
  const imageParts = resumeImagesBase64.map(base64ToPart);
  const textPart = { text: prompt };

  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [...imageParts, textPart] }
  });

  try {
      let jsonString = '';
      const combinedText = response.text;
      const jsonBlockMatch = combinedText.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonBlockMatch && jsonBlockMatch[1]) {
          jsonString = jsonBlockMatch[1];
      } else {
          const startIndex = combinedText.indexOf('{');
          const endIndex = combinedText.lastIndexOf('}');
          if (startIndex !== -1 && endIndex > startIndex) {
              jsonString = combinedText.substring(startIndex, endIndex + 1);
          }
      }

      if (jsonString) {
          return JSON.parse(jsonString);
      } else {
          throw new Error("No parsable JSON object found in the AI response for text generation.");
      }
  } catch (e) {
      console.error("Failed to parse JSON for text assets. Raw text:", response.text, "Error:", e);
      throw new Error("AI returned an invalid text format during content generation.");
  }
};

/**
 * STEP 2: Generates a new resume image using an original image as a template and new text.
 */
const generateImageAsset = async (
  resumeImageBase64: string,
  newText: string,
  pageNumber: number
): Promise<string> => {
    console.log(`Generating image for page ${pageNumber}...`);
    const prompt = `
        You are a visual design replication expert. Your task is to perfectly recreate a new image from a template, but with updated English text.

        **Instructions:**
        1. **Analyze Template:** The provided image is your visual template. Analyze its layout, fonts, colors, spacing, and all design elements.
        2. **Replace Text:** Replace the original text in the image with the new English text provided below. You must ensure the new text is rendered correctly and legibly in English.
        3. **Maintain Visual Fidelity:** The new image MUST be a perfect visual replica of the original. The only difference should be the text content. The output must be a single image. Do not add any new visual elements or change the design.

        **CRITICAL:** The output text MUST be in English and be the exact text provided below. Do not use placeholder or garbled text. The new image must be in English.

        **New English Text to Insert:**
        ---
        ${newText}
        ---
    `;
    const imagePart = base64ToPart(resumeImageBase64);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            console.log(`Successfully generated image for page ${pageNumber}.`);
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    
    console.error(`AI failed to generate an image for page ${pageNumber}. Raw response:`, JSON.stringify(response, null, 2));
    throw new Error(`AI failed to generate an image for page ${pageNumber}.`);
};

/**
 * Orchestrator function that runs the two-step generation process.
 */
export const generateTailoredAssets = async (
  resumeImagesBase64: string[],
  jobDetails: JobDetails
): Promise<Omit<GeneratedAssets, 'originalResumeText'>> => {
    // Step 1: Generate all text-based content first.
    console.log("Step 1: Generating paginated text assets...");
    const textAssets = await generateTextAssets(resumeImagesBase64, jobDetails);

    if (!textAssets.rewrittenResumeText || textAssets.rewrittenResumeText.length !== resumeImagesBase64.length) {
        throw new Error(`AI text generation mismatch: Expected text for ${resumeImagesBase64.length} pages, but received text for ${textAssets.rewrittenResumeText?.length || 0} pages.`);
    }

    // Step 2: Use the generated text to create the new resume images, processing each page individually in parallel.
    console.log(`Step 2: Generating ${resumeImagesBase64.length} new visual resume pages in parallel...`);
    
    const imageGenerationPromises = resumeImagesBase64.map((image, index) => 
        generateImageAsset(image, textAssets.rewrittenResumeText[index], index + 1)
    );

    const allNewImages = await Promise.all(imageGenerationPromises);
    
    if (allNewImages.length !== resumeImagesBase64.length) {
        throw new Error(`Final image count mismatch. Expected ${resumeImagesBase64.length} images, but only ${allNewImages.length} were generated successfully.`);
    }

    // Step 3: Assemble and return the final results.
    return { 
        tailoredResumeImages: allNewImages,
        coverLetter: textAssets.coverLetter,
        summary: textAssets.executiveSummary,
        changes: textAssets.changesMade,
        atsKeywords: textAssets.atsKeywords,
        rewrittenResumeText: textAssets.rewrittenResumeText.join('\n\n---\nPage Break\n---\n\n'),
    };
};

export const extractOriginalText = async (resumeImagesBase64: string[]): Promise<string> => {
    const prompt = "Transcribe all the text from the following resume images. Preserve the original line breaks and basic paragraph structure. Output only the plain text content.";
    
    const imageParts = resumeImagesBase64.map(base64ToPart);
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [...imageParts, textPart] }
    });
    
    return response.text;
};