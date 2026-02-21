import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.scafffood.my.id';
    
    const response = await fetch(`${backendUrl}/api/orders`, {
      headers: {
        'ngrok-skip-browser-warning': '1'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Failed to fetch orders:', response.status);
      return NextResponse.json({
        success: false,
        count: 0
      });
    }

    const data = await response.json();
    
    // Count orders with status "processing" (diterima/menunggu)
    const pendingCount = Array.isArray(data) ? data.filter((order: any) => 
      order.order_status === 'processing'
    ).length : 0;

    return NextResponse.json({
      success: true,
      count: pendingCount
    });
  } catch (error) {
    console.error('Error fetching pending orders count:', error);
    // Return 0 instead of 500 error to prevent UI errors
    return NextResponse.json({
      success: false,
      count: 0
    });
  }
}
