import { useState } from "react";
import VoiceCapture from "../components/VoiceCapture";

export default function Dashboard() {
  const [text, setText] = useState("");

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow w-[min(720px,92vw)] space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-600">Clique “Enregistrer”, parle, puis “Transcrire”.</p>

        <VoiceCapture onText={setText} />

        <div>
          <label className="text-sm text-slate-600">Transcription</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-2 w-full min-h-[160px] rounded-xl border border-slate-300 p-3"
            placeholder="La transcription apparaîtra ici…"
          />
        </div>
      </div>
    </div>
  );
}