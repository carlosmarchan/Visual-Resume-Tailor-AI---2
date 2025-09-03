import { GoogleGenAI, Modality, Part, Type } from "@google/genai";
import { GeneratedAssets, JobDetails } from "../types";

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
  changesMade: string[];
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
    You are a professional resume tailoring assistant. Your task is to analyze a user's resume (provided as images) and a job description (text) to produce a JSON object containing rewritten content.

    **Instructions:**
    1. **Analyze:** Deeply understand the original resume's content and the key requirements of the job description for "${jobDetails.jobTitle}" at "${jobDetails.companyName}".
    2. **Generate Content:** Create the following text assets based on your analysis:
        - A fully rewritten resume text. This text MUST be broken down into an array of strings, where each string in the array corresponds to the content for a single page. The number of strings MUST exactly match the number of resume images provided (${resumeImagesBase64.length}).
        - A professional cover letter.
        - An executive summary explaining the tailoring strategy.
        - A list of specific changes made.
        - A list of ATS keywords incorporated.
    3. **Format Output:** You MUST return a single, valid JSON object enclosed in a \`\`\`json markdown block. The JSON object must have these exact keys: "rewrittenResumeText", "coverLetter", "executiveSummary", "changesMade", "atsKeywords". The "rewrittenResumeText" key must be an array of strings.

    **CRITICAL:** Your output must ONLY be the JSON object in the markdown block. Do not include any other text or explanation.

    **Example JSON format:**
    \`\`\`json
    {
      "rewrittenResumeText": [
        "Page 1: John Doe\\n... (full text for the first page) ...",
        "Page 2: ... (full text for the second page) ..."
      ],
      "executiveSummary": "The resume was updated to highlight project management skills...",
      "changesMade": ["Replaced 'Led team' with 'Led a team of 5 engineers...'."],
      "atsKeywords": ["Product Roadmap", "Agile", "Data Analysis"],
      "coverLetter": "Dear Hiring Manager,\\n\\nI am writing to express my keen interest..."
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
      model: 'gemini-2.5-flash', // Using text-focused model for this step
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
        You are a visual design replication assistant. Your task is to create a new image based on a template, but with updated text.

        **Instructions:**
        1. **Use as Template:** The provided image is a visual template. Pay close attention to its layout, fonts, colors, spacing, and all other design elements.
        2. **Replace Text:** Replace all the text in the input image with the new text provided below.
        3. **Maintain Fidelity:** The new image must be a perfect visual replica of the original template. The only difference should be the text content. The output must be a single image.

        **CRITICAL:** Do not alter the design in any way. Your sole focus is replacing the text while maintaining 100% visual fidelity.

        **New Text to Insert:**
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