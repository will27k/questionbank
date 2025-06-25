import { NextRequest, NextResponse } from 'next/server';
import { PdfReader } from 'pdfreader';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { QuestionOptionsConfig } from '@/components/QuestionOptions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' },
});

async function getPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = '';
    new PdfReader(null).parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err);
      } else if (!item) {
        // End of file
        resolve(text);
      } else if (item.text) {
        text += item.text + ' ';
      }
    });
  });
}

function constructPrompt(options: QuestionOptionsConfig, fileName: string, focusArea: string): string {
  // 1. Map UI values to the new, more descriptive terminology for the prompt.
  const levelMap = {
    easy: 'Beginner',
    medium: 'Intermediate',
    hard: 'Expert',
  };
  const typeMap = {
    mcq: 'MCQ',
    trueFalse: 'True/False',
    shortAnswer: 'Short-Answer',
  };

  const requestedLevel = levelMap[options.difficulty];
  const requestedTypes = Object.entries(options.questionTypes)
    .filter(([, checked]) => checked)
    .map(([type]) => typeMap[type as keyof typeof typeMap])
    .join(', ');

  // 2. Conditionally add a focus instruction if the user provided one.
  const focusInstruction = focusArea
    ? `IMPORTANT: The user has specified a focus area. Prioritize generating questions from the parts of the document related to: "${focusArea}".`
    : '';

  // 3. Define the core instructions for the AI based on the new workflow.
  const instructions = `
You are a professional assessment-item writer.
${focusInstruction}

TASK:
1.  Read the provided PDF document.
2.  For the given cognitive LEVEL, calibrate the depth and phrasing of your questions:
    *   **Beginner:** Focus on recall and basic understanding of the material as presented.
    *   **Intermediate:** Focus on application and light analysis, requiring the user to connect concepts.
    *   **Expert:** Focus on synthesis, evaluation, and edge-case reasoning, challenging the user to apply material to new scenarios.
3.  Write the requested NUMBER of ITEMS in the chosen ITEM-TYPE(S):
    *   **MCQ:** Provide a stem, 4 plausible options (A-D), and identify the single correct answer.
    *   **True/False:** Provide a single, clear assertion.
    *   **Short-Answer:** Create a question where the expected open response is concise (around 30 words).

RULES:
*   Do not repeat the PDF content verbatim—paraphrase.
*   Cover different sections of the document to ensure broad coverage.
*   For MCQs & T/F, ensure distractors are plausible and avoid grammatical clues.
*   For the "ref" field in the JSON, provide a page number or other reference from the source.
  `;

  // 4. Combine instructions with a clear request for JSON output.
  return `
${instructions}

Please generate quiz items based on the following parameters, returning the output as a single, valid JSON object.

PARAMETERS:
*   **LEVEL:** ${requestedLevel}
*   **ITEM-TYPE(S):** ${requestedTypes}
*   **NUMBER OF ITEMS:** ${options.numQuestions}

The JSON object must have a single key "questions", containing an array of question objects with this exact structure:
{
  "stem": "Full text of the question",
  "type": "mcq, trueFalse, or shortAnswer",
  "options": ["Array of choices for mcq type"],
  "answer": "The correct answer. For mcq, use 'A', 'B', etc.",
  "ref": "Citation from source document"
}
  `;
}

export async function POST(request: NextRequest) {
  let assistantId: string | null = null;

  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const optionsString: string | null = data.get('options') as unknown as string;
    const focusArea: string | null = data.get('focusArea') as unknown as string;

    if (!file || !optionsString) {
      return NextResponse.json({ success: false, error: 'Missing file or options' }, { status: 400 });
    }

    const options: QuestionOptionsConfig = JSON.parse(optionsString);
    
    // 1. Extract text from PDF
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await getPdfText(fileBuffer);

    // 2. Upload text to OpenAI as a File for the vector store
    const fileObject = await toFile(Buffer.from(extractedText, 'utf-8'), `source-for-${file.name}.txt`);
    const openaiFile = await openai.files.create({
      file: fileObject,
      purpose: 'assistants',
    });
    
    // 3. Create an Assistant
    const assistant = await openai.beta.assistants.create({
      name: 'Question Generation Assistant',
      instructions: 'You are an expert exam writer. Your task is to generate questions based on the document provided. You must return the response as a single, valid JSON object and nothing else.',
      model: 'gpt-4o',
      tools: [{ type: 'file_search' }],
      response_format: { type: "json_object" },
    });
    assistantId = assistant.id;

    // 4. Create a Thread, add a message, and then run it
    const prompt = constructPrompt(options, file.name, focusArea || '');
    
    // Create an empty thread
    const thread = await openai.beta.threads.create();

    // Add the message to the thread
    await openai.beta.threads.messages.create(
      thread.id,
      {
        role: 'user',
        content: prompt,
        attachments: [{ file_id: openaiFile.id, tools: [{ type: 'file_search' }] }]
      }
    );

    // 5. Create and poll a Run in a single step
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id,
    });

    // 6. Retrieve and process the response
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(m => m.role === 'assistant');
      
      if (assistantMessage && assistantMessage.content[0].type === 'text') {
        const rawJson = assistantMessage.content[0].text.value;
        const jsonResponse = JSON.parse(rawJson.replace(/```json/g, '').replace(/```/g, ''));
        
        return NextResponse.json(jsonResponse);

      } else {
        throw new Error('No valid response from assistant.');
      }
    } else {
      throw new Error(`Run ended with status: ${run.status}`);
    }

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    // 7. Cleanup resources
    if (assistantId) {
      await openai.beta.assistants.delete(assistantId).catch(console.error);
    }
  }
} 