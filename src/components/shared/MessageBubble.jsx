import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brain } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  if (isUser) {
    // Ne pas afficher les messages de l'utilisateur
    return null;
  }
  
  return (
    <div className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
          <AvatarImage src="https://i.imgur.com/g8fP6b2.png" />
          <AvatarFallback className="bg-[#FF4D8D] text-white">
            <Brain className="w-4 h-4"/>
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 shadow-sm",
          isUser ? "bg-slate-800 text-white rounded-br-lg" : "bg-white border border-slate-200 rounded-bl-lg"
        )}>
          <ReactMarkdown 
            className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}