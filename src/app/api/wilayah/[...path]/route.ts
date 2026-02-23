import { NextRequest, NextResponse } from "next/server";

const DEFAULT_WILAYAH_API_BASE_URL = "https://wilayah.id/api";

const ensureTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments = [] } = await context.params;

  if (pathSegments.length === 0) {
    return NextResponse.json(
      { error: "Missing wilayah path." },
      { status: 400 },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_WILAYAH_API_BASE_URL ??
    DEFAULT_WILAYAH_API_BASE_URL;

  try {
    const upstreamUrl = new URL(
      pathSegments.join("/"),
      ensureTrailingSlash(baseUrl),
    );

    request.nextUrl.searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.append(key, value);
    });

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      return NextResponse.json(payload, { status: upstreamResponse.status });
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch wilayah data." },
      { status: 502 },
    );
  }
}
