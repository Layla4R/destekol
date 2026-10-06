import { generateChatAudio } from "@/lib/chat-audio";
import { CHAT_TEXT,chatLocale } from "@/lib/chat-translations";
import { enforceRequestLimit } from "@/lib/request-limit";
import { NextRequest,NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 15;
export async function POST(req: NextRequest) {
    const limited = await enforceRequestLimit(req, "chat-audio");
    if (limited) return limited;
    let input;
    try {
        input = await req.json();
    }
    catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (typeof input?.text !== "string" || !input.text.trim() || input.text.length > 6000)
        return NextResponse.json({ error: "Invalid speech text" }, { status: 400 });
    try {
        const audio = await generateChatAudio(input.text, input.locale);
        return new NextResponse(new Uint8Array(audio), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Speech-Voice": "male" } });
    }
    catch (error) {
        console.warn("[Chat speech]", error instanceof Error ? error.message : "Unavailable");
        return NextResponse.json({ error: CHAT_TEXT[chatLocale(input.locale)].audioFailed }, { status: 503 });
    }
}
