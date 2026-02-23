import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const url = `${backendUrl}/api/admin/products/${params.id}/toggle`;

    console.log(`[Toggle] PATCH ${url}`);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log(`[Toggle] Response:`, data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Toggle] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to toggle product availability' },
      { status: 500 }
    );
  }
}
