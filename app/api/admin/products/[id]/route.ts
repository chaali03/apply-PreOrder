import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const backendUrl = 'https://api.scafffood.my.id';
    const targetUrl = `${backendUrl}/api/admin/products/${params.id}`;
    
    const body = await request.json();
    console.log(`[Proxy] PUT ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(`[Proxy] Backend response status: ${response.status}`);
    console.log(`[Proxy] Backend response data:`, data);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const backendUrl = 'https://api.scafffood.my.id';
    const targetUrl = `${backendUrl}/api/admin/products/${params.id}`;
    
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
      { success: false, message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const backendUrl = 'https://api.scafffood.my.id';
    const targetUrl = `${backendUrl}/api/admin/products/${params.id}/toggle`;
    
    console.log(`[Proxy] PATCH ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to toggle product' },
      { status: 500 }
    );
  }
}
