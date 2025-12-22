
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User as UserIcon, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function ChatWidget() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isAiAvailable, setIsAiAvailable] = useState<boolean | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Ref to hold the session
    const sessionRef = useRef<any>(null);

    useEffect(() => {
        checkAiAvailability();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    const checkAiAvailability = async () => {
        if (typeof window !== "undefined" && window.ai) {
            try {
                const capabilities = await window.ai.languageModel.capabilities();
                if (capabilities.available === "readily") {
                    setIsAiAvailable(true);
                } else {
                    // 'after-download' or 'no'
                    // For this MVP we'll treat after-download as not ready for instant chat
                    console.log("AI available state:", capabilities.available);
                    setIsAiAvailable(false);
                }
            } catch (e) {
                console.error("Error checking AI capabilities:", e);
                setIsAiAvailable(false);
            }
        } else {
            setIsAiAvailable(false);
        }
    };

    const initSession = async () => {
        if (sessionRef.current) return sessionRef.current;

        let dbContext = "";
        let userInfo = { agentName: 'Alex', userName: 'User' };

        try {
            // Attempt to fetch context
            // In extension mode, this might fail if the server isn't reachable
            const res = await fetch('/api/ai-context');
            if (res.ok) {
                const body = await res.json();
                if (body.success) {
                    dbContext = body.data.context;
                    userInfo = body.data.userInfo;
                }
            }
        } catch (e) {
            console.warn("Context fetch failed, using default prompt", e);
        }

        const systemPrompt = `
You are ${userInfo.agentName || 'Alex'}, a productivity assistant for ${userInfo.userName || 'User'}.
Use this context to answer questions:
${dbContext || 'No context available.'}

Be concise. Do not answer questions unrelated to the user's data or productivity.
        `.trim();

        try {
            if (!window.ai) throw new Error("AI not supported");

            const session = await window.ai.languageModel.create({
                systemPrompt
            });

            sessionRef.current = session;
            return session;
        } catch (err) {
            console.error("Failed to init session:", err);
            throw err;
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        if (!isAiAvailable) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Chrome AI is not enabled. Please use Chrome Canary or enable experimental flags." }]);
            return;
        }

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const session = await initSession();

            // Streaming response
            const stream = session.promptStreaming(userMessage);

            let fullResponse = "";
            setMessages(prev => [...prev, { role: "assistant", content: "" }]); // Add placeholder

            for await (const chunk of stream) {
                fullResponse = chunk;
                setMessages(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { role: "assistant", content: fullResponse };
                    return newHistory;
                });
            }

        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Error: Failed to generate response on-device." },
            ]);
            // Reset session on error in case it's stuck
            sessionRef.current = null;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background/50 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-white/5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white/90">
                    {isAiAvailable === true ? "On-Device Assistant" : "Assistant (Offline)"}
                </span>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4 min-h-[200px]">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground mt-10">
                            <Bot className="w-8 h-8 mb-2 opacity-50" />
                            {isAiAvailable === false ? (
                                <div className="max-w-[200px] text-xs text-yellow-500/80 bg-yellow-500/10 p-2 rounded">
                                    <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                                    Chrome AI not detected. Enable <code>chrome://flags/#prompt-api-for-gemini-nano</code>
                                </div>
                            ) : (
                                <p className="text-sm">Ready to help (offline mode)</p>
                            )}
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-3 text-sm max-w-[95%]",
                                m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    m.role === "user" ? "bg-blue-600" : "bg-purple-600"
                                )}
                            >
                                {m.role === "user" ? <UserIcon size={14} /> : <Bot size={14} />}
                            </div>
                            <div
                                className={cn(
                                    "p-3 rounded-lg overflow-hidden",
                                    m.role === "user"
                                        ? "bg-blue-600/20 text-white border border-blue-500/30"
                                        : "bg-white/10 text-white border border-white/10"
                                )}
                            >
                                {m.content}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                            <span className="text-xs text-white/40">Generating...</span>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-white/5">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isAiAvailable === false ? "AI not available" : "Ask about your schedule..."}
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-purple-500/50"
                        disabled={isAiAvailable === false}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim() || isAiAvailable === false}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Send size={16} />
                    </Button>
                </div>
            </form>
        </div>
    );
}
