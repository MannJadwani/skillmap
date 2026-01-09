import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Roadmap, RoadmapNode, UserPreferences, NodeType, Difficulty } from "../types";

// Define the response schema strictly
const roadmapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy title for the roadmap" },
    description: { type: Type.STRING, description: "A brief overview of what will be learned" },
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique string ID, e.g., 'concept-basics', 'proj-1'" },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { 
            type: Type.STRING, 
            enum: ["CONCEPT", "PROJECT", "MILESTONE", "RESOURCE"],
            description: "The type of learning step"
          },
          difficulty: {
            type: Type.STRING,
            enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
          },
          estimatedHours: { type: Type.NUMBER, description: "Estimated hours to complete this step" },
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Key keywords or sub-topics covered"
          },
          dependencies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of node IDs that must be completed BEFORE this node. Foundational nodes have empty arrays."
          }
        },
        required: ["id", "title", "description", "type", "difficulty", "estimatedHours", "topics", "dependencies"],
      }
    }
  },
  required: ["title", "description", "nodes"]
};

export const generateRoadmap = async (prefs: UserPreferences, apiKey: string): Promise<Roadmap> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Create a detailed, branching learning roadmap for a user who wants to learn "${prefs.targetSkill}".
    
    User Profile:
    - Current Level: ${prefs.currentLevel}
    - Background/Experience: ${prefs.background}
    - Preferred Learning Style: ${prefs.learningStyle}

    Requirements:
    1. Structure: Return a Directed Acyclic Graph (DAG) via the 'dependencies' field. 
       - Foundational concepts should have NO dependencies ([]).
       - Advanced concepts MUST depend on specific previous nodes.
       - Allow for branching paths (e.g., learning "CSS" and "JS" in parallel after "HTML").
    2. Nodes:
       - "CONCEPT" for theory.
       - "PROJECT" for application (crucial for this user).
       - "MILESTONE" for major checkpoints.
    3. Content:
       - Start from their current level.
       - Generate 10-15 nodes.
       - Ensure logical progression.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: roadmapSchema,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(jsonText) as Roadmap;
    // Add default status
    data.nodes = data.nodes.map(n => ({ ...n, status: 'pending' }));
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate roadmap. Please check your API key and try again.");
  }
};