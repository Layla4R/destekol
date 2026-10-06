import { EdgeTTS } from "node-edge-tts";
import { randomBytes } from "node:crypto";
const voices: Record<string, string> = { ar: "ar-SA-HamedNeural", en: "en-US-GuyNeural", fr: "fr-FR-HenriNeural", tr: "tr-TR-AhmetNeural" };
export async function generateChatAudio(text: string, locale: string) {
    const voice = voices[locale] || voices.ar;
    const clean = text.replace(/<[^>]*>/g, " ").replace(/[*#`]/g, "").trim();
    if (!clean || clean.length > 6000)
        throw new Error("Invalid speech text");
    return new Promise<Buffer>((resolve, reject) => {
        let socket: Awaited<ReturnType<EdgeTTS["_connectWebSocket"]>> | undefined;
        let done = false;
        const chunks: Buffer[] = [];
        const finish = (error?: Error) => {
            if (done)
                return;
            done = true;
            clearTimeout(timer);
            socket?.terminate();
            if (error)
                reject(error);
            else if (!chunks.length)
                reject(new Error("Empty speech"));
            else
                resolve(Buffer.concat(chunks));
        };
        const timer = setTimeout(() => finish(new Error("Speech timeout")), 10000);
        const tts = new EdgeTTS({ voice, lang: voice.slice(0, 5), outputFormat: "audio-24khz-48kbitrate-mono-mp3" });
        tts._connectWebSocket().then(ws => {
            socket = ws;
            if (done) {
                ws.terminate();
                return;
            }
            ws.on("error", () => finish(new Error("Speech connection failed")));
            ws.on("close", () => finish(new Error("Speech connection closed")));
            ws.on("message", (raw: Buffer, binary: boolean) => {
                const data = Buffer.from(raw);
                if (binary) {
                    if (data.length < 2)
                        return;
                    const offset = data.readUInt16BE(0) + 2;
                    if (offset <= data.length)
                        chunks.push(data.subarray(offset));
                }
                else if (data.toString().includes("Path:turn.end"))
                    finish();
            });
            const escaped = clean.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!));
            ws.send('X-RequestId:' + randomBytes(16).toString("hex") + '\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n' + '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="' + voice.slice(0, 5) + '"><voice name="' + voice + '"><prosody rate="+0%" pitch="+0Hz">' + escaped + '</prosody></voice></speak>');
        }).catch(() => finish(new Error("Speech unavailable")));
    });
}
