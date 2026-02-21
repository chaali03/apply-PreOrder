import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = 'https://api.scafffood.my.id';
    const targetUrl = `${backendUrl}/api/admin/qris/${params.id}`;
    
    const body = await request.json();
    console.log(`[Proxy] PUT ${targetUrl}`, body);
    
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update QRIS' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = 'https://api.scafffood.my.id';
    const targetUrl = `${backendUrl}/api/admin/qris/${params.id}`;
    
    console.log(`[Proxy] DELETE ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete QRIS' },
      { status: 500 }
    );
  }
}
