import { NextRequest, NextResponse } from 'next/server';

// This is a catch-all proxy for all /api/* requests
// It forwards requests to the Go backend

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8080';
    
    // Construct the full path
    const path = pathSegments.join('/');
    const targetUrl = `${backendUrl}/api/${path}`;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl;
    
    console.log(`[Proxy] ${method} ${fullUrl}`);
    
    // Prepare request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1',
      },
    };
    
    // Add body for POST, PUT, PATCH
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await request.text();
        if (body) {
          options.body = body;
        }
      } catch (e) {
        // No body or invalid body
      }
    }
    
    // Forward the request to backend
    const response = await fetch(fullUrl, options);
    
    // Get response data
    const data = await response.text();
    
    // Try to parse as JSON, otherwise return as text
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { data };
    }
    
    // Return response with same status code
    return NextResponse.json(jsonData, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    
  } catch (error) {
    console.error('[Proxy Error]', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to connect to backend',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
