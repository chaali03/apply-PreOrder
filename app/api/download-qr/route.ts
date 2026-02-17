import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Fetch the image from the backend
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Return the image with proper headers for download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': blob.type || 'image/png',
        'Content-Disposition': `attachment; filename="QRIS-SCAFFFOOD-${Date.now()}.png"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error downloading QR:', error);
    return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
  }
}
