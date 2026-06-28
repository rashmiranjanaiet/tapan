import {
  AI_GURU_LAB_API_KEY,
  GEMINI_API_KEY,
  isDemoKey,
} from "@/config/app-config";
import { getCollections } from "@/config/db";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { NextResponse } from "next/server";

const PROMPT = `Generate Learning Course depends on following details. In which Make sure to add Course Name, Description, Course Banner Image Prompt(Create a modern, flat-style 2D digital illustration representing user Topic. Include UI/UX elements such as mockup screens, text blocks, icons, buttons and creative workspace tools. Add symbolic elements related to user Course like sticky notes, design components, and visual aids. Use a vibrant color palette (blues, purple, oranges) with a clean, professional look. The illustration should feel creative, tech-savvy, and educational, ideal for visualizing concepts in user Course for Course Banner in 3d format) Chapter Name, Topic under each chapters, Duration for each chapters etc in JSON format only. 

Schema:

{
  "course": {
    "name": "string",
    "description": "string",
    "category": "string",
    "noOfchapters": "number",
    "bannerImagePrompt": "string",
    "chapters": [
      {
        "chapterName": "string",
        "duration": "string",
        "topic": ["string"]
      }
    ]
  }
}

User Input:
`;
export const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

function getDemoCourse(formData) {
  const name = formData?.name || formData?.topic || "Demo Course";
  const noOfChapters = Number(formData?.noOfChapters || 3);

  return {
    course: {
      name,
      description:
        formData?.description ||
        `A practical beginner-friendly course for learning ${name}.`,
      category: formData?.category || "Demo",
      noOfchapters: noOfChapters,
      bannerImagePrompt: `Modern education illustration for ${name}`,
      chapters: Array.from({ length: noOfChapters }, (_, index) => ({
        chapterName: `Chapter ${index + 1}: ${name} Basics`,
        duration: "30 min",
        topic: [
          `${name} overview`,
          `${name} key concepts`,
          `${name} practice task`,
        ],
      })),
    },
  };
}

export async function POST(req) {
  // To run this code you need to install the following dependencies:
  // npm install @google/genai mime
  // npm install -D @types/node
  const { courseId, ...formData } = await req.json();
  const user = await currentUser();
 
  const config = {
    thinkingConfig: {
      thinkingBudget: -1,
    },
  };
  const model = "gemini-2.5-flash";
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: PROMPT+JSON.stringify(formData),
        },
      ],
    },
  ];

  let JSONResp;

  if (isDemoKey(GEMINI_API_KEY)) {
    JSONResp = getDemoCourse(formData);
  } else {
    const response = await ai.models.generateContent({
      model,
      config,
      contents,
    });

    const RawResp = response?.candidates[0]?.content?.parts[0]?.text;
    const RawJson = RawResp.replace("```json", "").replace("```", "");
    JSONResp = JSON.parse(RawJson);
  }

  const ImagePrompt = JSONResp.course?.bannerImagePrompt;
  const bannerImageUrl = await GenerateImage(ImagePrompt);
  const { courses } = await getCollections();

  await courses.insertOne({
    ...formData,
    courseJson: JSONResp,
    userEmail: user?.primaryEmailAddress?.emailAddress,
    cid: courseId,
    bannerImageUrl,
    courseContent: [],
    createdAt: new Date(),
  });

  return NextResponse.json({ courseId: courseId });
}


const GenerateImage = async (imagePrompt) => {
  const BASE_URL = "https://aigurulab.tech";
  try {
    if (isDemoKey(AI_GURU_LAB_API_KEY)) {
      return "/online-education.png";
    }

    const result = await axios.post(
      BASE_URL + "/api/generate-image",
      {
        width: 1024,
        height: 1024,
        input: imagePrompt,
        model: "sdxl",
        aspectRatio: "16:9",
      },
      {
        headers: {
          "x-api-key": AI_GURU_LAB_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Image generated successfully");
    return result.data.image;
  } catch (err) {
    console.error("Aigurulab API error:", err.response?.data || err.message);
    return null;
  }
};
