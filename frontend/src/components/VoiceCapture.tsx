import { useEffect, useRef, useState } from "react";

type Props = {
  apiUrl?: string; // ex: http://localhost:8000
  onText?: (text: string) => void;
};

export default function VoiceCapture({ apiUrl = import.meta.env.VITE_API_URL, onText }: Props) {
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    };
    mediaRecRef.current = rec;
    rec.start();
    setRecording(true);
  }

  function stop() {
    mediaRecRef.current?.stop();
    mediaRecRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  async function send() {
    if (!blobUrl) return;
    setBusy(true);
    try {
      const blob = await fetch(blobUrl).then((r) => r.blob());
      const fd = new FormData();
      fd.append("file", new File([blob], "audio.webm", { type: "audio/webm" }));

      const res = await fetch(`${apiUrl.replace(/\/$/, "")}/ai/transcribe`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json(); // { text, language? }
      onText?.(data.text);
    } catch (e: any) {
      alert(e?.message || "Transcription échouée");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {!recording ? (
          <button onClick={start} className="rounded-xl bg-slate-900 text-white px-4 py-2">
            🎙️ Enregistrer
          </button>
        ) : (
          <button onClick={stop} className="rounded-xl bg-amber-600 text-white px-4 py-2">
            ⏹️ Stop
          </button>
        )}
        <button
          onClick={send}
          disabled={!blobUrl || busy}
          className="rounded-xl bg-emerald-600 text-white px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Transcription…" : "Transcrire"}
        </button>
      </div>

      {blobUrl && (
        <audio controls src={blobUrl} className="w-full">
          Votre navigateur ne supporte pas l’audio HTML5.
        </audio>
      )}
    </div>
  );
}