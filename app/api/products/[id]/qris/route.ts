import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = 'https://api.scafffood.my.id';
    const targetUrl = `${backendUrl}/api/products/${params.id}/qris`;
    
    console.log(`[Proxy] GET ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product QRIS' },
      { status: 500 }
    );
  }
}
