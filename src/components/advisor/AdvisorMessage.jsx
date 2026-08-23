import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronRight, Loader2, Check, AlertTriangle } from "lucide-react";

const FAILED = /error|failed/i;

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const proj = toolCall.display_projection || {};

  let parsed = toolCall.results;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { /* garder la valeur brute */ }
  }

  const running = ["pending", "running", "in_progress"].includes(toolCall.status);
  const failed =
    FAILED.test(toolCall.status || "") ||
    (typeof toolCall.results === "string" && FAILED.test(toolCall.results)) ||
    parsed?.success === false;

  const label = failed
    ? proj.error_label || "Analyse interrompue"
    : running
      ? proj.active_label || "Consultation des avis…"
      : proj.label || `${(toolCall.name || "").replace(/_/g, " ")}`;

  const hidden = proj.hide_details && proj.details_redacted;

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => !hidden && setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-ink/60 hover:text-ink font-medium"
      >
        {running ? <Loader2 className="w-3 h-3 animate-spin" />
          : failed ? <AlertTriangle className="w-3 h-3 text-pen" />
            : <Check className="w-3 h-3 text-grade-high" />}
        <span className="capitalize">{label}</span>
        {!hidden && <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />}
      </button>

      {expanded && !hidden && (
        <div className="mt-1.5 space-y-1.5 rounded-lg border-2 border-ink/15 bg-ink/[0.03] p-2">
          {toolCall.arguments_string && (
            <div>
              <p className="font-semibold text-ink/70">Paramètres</p>
              <pre className="whitespace-pre-wrap break-all text-[10px] text-ink/60">
                {(() => {
                  try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); }
                  catch { return toolCall.arguments_string; }
                })()}
              </pre>
            </div>
          )}
          {parsed !== undefined && parsed !== null && (
            <div>
              <p className="font-semibold text-ink/70">Résultat</p>
              <pre className="whitespace-pre-wrap break-all text-[10px] text-ink/60 max-h-40 overflow-y-auto">
                {typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdvisorMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] rounded-2xl border-2 px-3.5 py-2.5 ${
          isUser
            ? "border-ink/80 bg-highlight text-ink shadow-hard-ink"
            : "border-ink/20 bg-card text-ink"
        }`}
      >
        {message.content && (isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="text-sm prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-ink prose-strong:text-ink prose-p:text-ink/80 prose-li:text-ink/80">
            {message.content}
          </ReactMarkdown>
        ))}

        {message.tool_calls?.map((toolCall, idx) => (
          <ToolCallDisplay key={idx} toolCall={toolCall} />
        ))}
      </div>
    </div>
  );
}