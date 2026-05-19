import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_DOMAINS = [
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'www.google.com',
  'google.com',
];

const FETCH_TIMEOUT_MS = 5_000;

/** Returns true when the hostname belongs to the allow-list. */
function isAllowedHost(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith('.' + domain)
  );
}

/** Blocks private/loopback IP ranges to prevent SSRF. */
function isPrivateHost(hostname: string): boolean {
  // Reject numeric IPs that look private/loopback
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0 ||
      a === 169
    ) {
      return true;
    }
  }
  // Block localhost and common internal hostnames
  return hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal');
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Only accept https
  if (parsedUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS URLs are supported' }, { status: 400 });
  }

  if (!isAllowedHost(parsedUrl.hostname) || isPrivateHost(parsedUrl.hostname)) {
    return NextResponse.json(
      { error: 'Only Google Maps URLs are supported' },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; InventoryBot/1.0)',
      },
    });

    // Validate the final resolved URL is still on an allowed domain
    let finalUrl: URL;
    try {
      finalUrl = new URL(response.url);
    } catch {
      return NextResponse.json({ error: 'Invalid resolved URL' }, { status: 502 });
    }

    if (!isAllowedHost(finalUrl.hostname) || isPrivateHost(finalUrl.hostname)) {
      return NextResponse.json(
        { error: 'Resolved URL is not a Google Maps URL' },
        { status: 400 }
      );
    }

    return NextResponse.json({ resolvedUrl: response.url });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
    }
    console.error('Error resolving Maps link:', error);
    return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
