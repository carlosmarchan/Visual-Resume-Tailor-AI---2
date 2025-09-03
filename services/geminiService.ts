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

type TailoredAssetsResponse = {
  tailoredResumeImages: string[];
  coverLetter: string;
  summary: string;
  changes: string[];
  atsKeywords: string[];
}

export const generateTailoredAssets = async (
  resumeImagesBase64: string[],
  jobDetails: JobDetails
): Promise<TailoredAssetsResponse> => {
    const prompt = `
        You are a professional resume tailoring assistant. Your task is to take a user's resume (provided as images), and a job description (provided as text), and generate multiple outputs:
        1. A new set of resume images that are visually identical to the original but with the text content updated to better match the job description.
        2. A JSON object containing specific details.

        **Instructions:**
        1. **Analyze the Resume & Job Description:** Understand the original resume's content/design and identify key requirements from the job description for "${jobDetails.jobTitle}" at "${jobDetails.companyName}".
        2. **Rewrite Resume Content:** Update the "Summary" and "Work Experience" sections to align with the job description. Use strong action verbs and quantify achievements.
        3. **Generate New Resume Images:** Create new images that are a perfect visual replica of the originals. The layout, fonts, spacing, and colors must be identical. The only change is the updated text. The number of output images must match the number of input images.
        4. **Generate Structured Text:** As part of your text response, you MUST include a single JSON object enclosed in a \`\`\`json markdown block. This JSON object must contain the following keys:
            - "executiveSummary": A string explaining the strategy behind the resume changes.
            - "changesMade": An array of strings, where each string is a specific bullet point change.
            - "atsKeywords": An array of strings representing keywords added to improve ATS compatibility.
            - "coverLetter": A string containing the full text of a professional cover letter.

        **CRITICAL:** The visual fidelity of the new resume images is paramount. Do not alter the design. The JSON output must be a single, valid JSON object within a \`\`\`json code block. Your text response should contain ONLY this JSON block.

        **Job Description:**
        ---
        ${jobDetails.jobDescription}
        ---
    `;

    const imageParts = resumeImagesBase64.map(base64ToPart);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [...imageParts, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const generatedImages: string[] = [];
    let textContent: {
        executiveSummary: string;
        changesMade: string[];
        atsKeywords: string[];
        coverLetter: string;
    } | null = null;

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            generatedImages.push(`data:${mimeType};base64,${base64ImageBytes}`);
        } else if (part.text) {
            try {
                let jsonString = '';
                // Look for a markdown code block and extract its content, tolerating whitespace
                const jsonBlockMatch = part.text.match(/```json\s*([\s\S]*?)\s*```/);
                
                if (jsonBlockMatch && jsonBlockMatch[1]) {
                    jsonString = jsonBlockMatch[1];
                } else {
                    // Fallback: If no markdown block is found, find the substring
                    // from the first '{' to the last '}'
                    const startIndex = part.text.indexOf('{');
                    const endIndex = part.text.lastIndexOf('}');
                    if (startIndex !== -1 && endIndex > startIndex) {
                        jsonString = part.text.substring(startIndex, endIndex + 1);
                    }
                }

                if (jsonString) {
                    textContent = JSON.parse(jsonString);
                } else {
                    // If we couldn't find any JSON, throw an error.
                    throw new Error("No parsable JSON object found in the AI response.");
                }

            } catch (e) {
                console.error("Failed to parse JSON response from AI. Raw text:", part.text, "Error:", e);
                throw new Error("AI returned an invalid text format. Could not parse summary and changes.");
            }
        }
    }

    if (generatedImages.length === 0 || !textContent) {
        throw new Error("AI failed to generate both resume images and the required text content.");
    }
    
    return { 
        tailoredResumeImages: generatedImages,
        coverLetter: textContent.coverLetter,
        summary: textContent.executiveSummary,
        changes: textContent.changesMade,
        atsKeywords: textContent.atsKeywords,
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