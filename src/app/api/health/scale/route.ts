import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/whoop";
import { scaleReading } from "@/lib/health";
export async function POST(request: NextRequest) {
  const json = (body: object, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  if (!sameOrigin(request)) return json({ error: "invalid_origin" }, 403);
  const key = process.env.GOOGLE_VISION_API_KEY;
  if (!key)
    return json(
      {
        error: "not_configured",
        message:
          "Photo reading isn’t connected yet. Please enter the scale reading below.",
      },
      503,
    );
  if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024)
    return json({ error: "too_large" }, 413);
  try {
    const data = await request.formData();
    const photo = data.get("photo");
    if (
      !(photo instanceof File) ||
      !["image/jpeg", "image/png", "image/webp"].includes(photo.type) ||
      photo.size > 5 * 1024 * 1024 ||
      photo.size === 0
    )
      return json({ error: "invalid_image" }, 400);
    const response = await fetch(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: Buffer.from(await photo.arrayBuffer()).toString(
                  "base64",
                ),
              },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      },
    );
    if (!response.ok) return json({ error: "unavailable" }, 502);
    const result = await response.json();
    const text =
      result.responses?.[0]?.fullTextAnnotation?.text ||
      result.responses?.[0]?.textAnnotations?.[0]?.description;
    if (typeof text !== "string") return json({ error: "unreadable" }, 422);
    const reading = scaleReading(text);
    return reading
      ? json({ ...reading, needsConfirmation: true })
      : json(
          {
            error: "ambiguous",
            message:
              "We couldn’t read one clear weight. Retake the photo or enter it manually.",
          },
          422,
        );
  } catch {
    return json({ error: "unavailable" }, 502);
  }
}
