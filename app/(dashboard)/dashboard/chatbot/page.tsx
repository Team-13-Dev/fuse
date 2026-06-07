"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, User } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
}

export default function FuseChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [businessId, setBusinessId] = useState();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetch("/api/me/context")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeBusinessId) {
          setBusinessId(data.activeBusinessId);
        }
      })
      .catch((err) => console.error("Failed to load business context", err));
  }, [])

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Guard clause: Don't send if we haven't loaded the businessId yet
  if (!input.trim() || isLoading || !businessId) {
    if (!businessId) console.warn("Waiting for business context...");
    return;
  }

  const userMessage = input.trim();
  setInput("");
  
  const nextMessages: ChatMessage[] = [
    ...messages,
    { role: "user", content: userMessage },
  ];
  setMessages(nextMessages);
  setIsLoading(true);
  try {
    const res = await fetch("https://chatbot-production-d2f4.up.railway.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: businessId,
        message: userMessage,
        history: messages,
      }),
    });
        
    if (!res.ok) throw new Error("Server error");

    const data = await res.json();  
    
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.reply },
    ]);
    
  } catch (error) {
    console.error("Chat error:", error);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Something went wrong. Please try again." },
    ]);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="w-full h-full grid place-content-center">
      <div className="flex flex-col h-175 xl:min-w-175 max-w-4xl mx-auto bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden font-sans antialiased">      
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100/60 bg-white/70 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-black text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                Fuse Assistant
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                AI-powered growth engine
              </p>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAFAFA]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400">
              <Sparkles className="w-12 h-12 text-gray-200" />
              <p className="text-lg font-medium text-gray-500">
                How can I help you grow your business today?
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-4 max-w-[80%] ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div className="hrink-0 mt-1">
                    {msg.role === "assistant" ? (
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shadow-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`px-6 py-4 rounded-3xl text-[15px] leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-black text-white rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="flex gap-4 max-w-[80%]">
                <div className="shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="px-6 py-5 rounded-3xl bg-white border border-gray-100 rounded-tl-sm shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-100">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask about your business data..."
              className="w-full pl-6 pr-14 py-4 bg-[#F5F5F7] hover:bg-[#EFEFF1] transition-colors border-none rounded-full text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-black"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-px" /> // ml-[1px] optically centers the send icon
              )}
            </button>
          </form>
        </div>
      
      </div>
    </div>
  );
}