import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, GraduationCap, Loader2 } from "lucide-react";
import AdvisorMessage from "@/components/advisor/AdvisorMessage";

const SUGGESTIONS = [
  "Quel est le meilleur lycée de ma ville ?",
  "Compare les écoles de commerce les mieux notées",
  "Je cherche un établissement avec une bonne ambiance",
  "Où trouve-t-on les profs les mieux notés ?",
];

export default function AdvisorPage() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      const conv = await base44.agents.createConversation({
        agent_name: "school_advisor",
        metadata: { name: "Orientation", description: "Choisir mon établissement" },
      });
      setConversation(conv);
    })();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || !conversation || sending) return;
    setInput("");
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content });
    setSending(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-5 sm:mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <GraduationCap className="w-7 h-7 text-pen" />
          <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-ink">
            Le Conseiller
          </h1>
        </div>
        <p className="handwritten text-lg sm:text-2xl">
          Il lit tous les avis pour toi 📚
        </p>
      </div>

      <div className="card-notebook p-3 sm:p-5 flex flex-col" style={{ minHeight: "60vh" }}>
        <div className="flex-1 space-y-3 overflow-y-auto max-h-[55vh] pr-1">
          {messages.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-ink/60 mb-4">
                Dis-moi ce que tu cherches, j'analyse les notes et les avis des établissements pour toi.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={!conversation}
                    className="rounded-full border-2 border-ink/25 bg-highlight/30 px-3 py-1.5 text-xs font-medium text-ink hover:bg-highlight/60 transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => <AdvisorMessage key={i} message={m} />)
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex items-end gap-2 border-t-2 border-ink/10 pt-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ex : les meilleurs lycées à Lyon pour l'ambiance…"
            rows={2}
            className="resize-none rounded-xl border-2 border-ink/20"
          />
          <Button onClick={() => send()} disabled={!conversation || sending || !input.trim()} size="icon" className="h-10 w-10 shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-ink/50">
        Les analyses reposent sur les avis d'élèves publiés — ce ne sont pas des évaluations officielles.
      </p>
    </div>
  );
}