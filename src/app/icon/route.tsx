import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        // Redirect to intro.png in the public directory
        return new Response(null, {
            status: 307, // Temporary redirect
            headers: {
                'Location': '/intro.png',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (e) {
        console.error(e);
        return new Response('Failed to redirect to image', { status: 500 });
    }
} 