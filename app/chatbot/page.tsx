"use client";

import { useState, useRef, useEffect } from "react";
import aiLogo from "@/public/aiLogo.png"
import Image from "next/image";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      console.log(data);

      const aiMessage: Message = {
        role: "assistant",
        content: data.reply,
      };

      setMessages([...updatedMessages, aiMessage]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "Something went wrong." },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 text-black">
      {/* Header */}
      <div className="p-4 font-semibold text-lg flex items-center gap-2">
        <Image src={aiLogo} alt="AI-LOGO" width={30}/>
        Fuse AI Assistant
      </div>
    
    <div className="p-3 border">
      <input
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            uploadFile(e.target.files[0]);
          }
        }}
      />
    </div>


      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-gray-500 text-center mt-20">
            Upload your dataset and start asking questions...
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`
                max-w-[75%] px-4 py-2 rounded-2xl text-sm
                ${
                  msg.role === "user"
                    ? "bg-black text-black rounded-br-none"
                    : "bg-white text-black border rounded-bl-none"
                }
              `}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-2xl border text-sm">
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          placeholder="Ask about your data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  alert("Dataset uploaded!");
};