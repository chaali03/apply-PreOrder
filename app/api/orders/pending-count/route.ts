import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.scafffood.my.id';
    
    const response = await fetch(`${backendUrl}/api/orders`, {
      headers: {
        'ngrok-skip-browser-warning': '1'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const data = await response.json();
    
    // Count orders with status "processing" (diterima/menunggu)
    const pendingCount = data.filter((order: any) => 
      order.order_status === 'processing'
    ).length;

    return NextResponse.json({
      success: true,
      count: pendingCount
    });
  } catch (error) {
    console.error('Error fetching pending orders count:', error);
    return NextResponse.json({
      success: false,
      count: 0
    }, { status: 500 });
  }
}
