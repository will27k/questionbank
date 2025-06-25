import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import QuestionPdfDocument from '@/components/QuestionPdfDocument';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions, title } = body;

    if (!questions || !title) {
      return NextResponse.json({ success: false, error: 'Missing questions or title' }, { status: 400 });
    }

    const stream = await renderToStream(
      <QuestionPdfDocument questions={questions} title={title} />
    );

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${title.replace(/\s/g, '_')}.pdf"`);

    // The stream from @react-pdf/renderer is a NodeJS.ReadableStream, but NextResponse expects a ReadableStream.
    // We can convert it.
    const bodyStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        stream.on('end', () => {
          controller.close();
        });
        stream.on('error', (err) => {
          controller.error(err);
        });
      },
    });

    return new NextResponse(bodyStream, { headers });

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
} 