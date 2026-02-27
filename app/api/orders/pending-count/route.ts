import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const url = `${backendUrl}/api/orders/pending-count`;

    console.log(`[Pending Count] GET ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`[Pending Count] Backend returned ${response.status}`);
      // Return 0 count if backend is down instead of failing
      return NextResponse.json({
        success: true,
        count: 0,
      });
    }

    const data = await response.json();
    console.log(`[Pending Count] Response:`, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Pending Count] Error:', error);
    // Return 0 count gracefully instead of error
    return NextResponse.json({
      success: true,
      count: 0,
    });
  }
}
