"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User as UserIcon, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import styles from "./chat-widget.module.css";

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
        if (typeof window !== "undefined" && (window as any).ai) {
            try {
                const capabilities = await (window as any).ai.languageModel.capabilities();
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
            const windowAi = (window as any).ai;
            if (!windowAi) throw new Error("AI not supported");

            const session = await windowAi.languageModel.create({
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
        <div className={styles.container}>
            <div className={styles.header}>
                <Sparkles className={styles.headerIcon} />
                <span className={styles.headerTitle}>
                    {isAiAvailable === true ? "On-Device Assistant" : "Assistant (Offline)"}
                </span>
            </div>

            <ScrollArea className={styles.scrollArea}>
                <div className={styles.messagesContainer}>
                    {messages.length === 0 && (
                        <div className={styles.emptyState}>
                            <Bot className={styles.emptyIcon} />
                            {isAiAvailable === false ? (
                                <div className={styles.alertBox}>
                                    <AlertCircle className={styles.alertIcon} />
                                    Chrome AI not detected. Enable <code>chrome://flags/#prompt-api-for-gemini-nano</code>
                                </div>
                            ) : (
                                <p className={styles.emptyText}>Ready to help (offline mode)</p>
                            )}
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                styles.messageRow,
                                m.role === "user" ? styles.userRow : styles.assistantRow
                            )}
                        >
                            <div
                                className={cn(
                                    styles.avatar,
                                    m.role === "user" ? styles.userAvatar : styles.assistantAvatar
                                )}
                            >
                                {m.role === "user" ? <UserIcon size={14} /> : <Bot size={14} />}
                            </div>
                            <div
                                className={cn(
                                    styles.messageBubble,
                                    m.role === "user" ? styles.userBubble : styles.assistantBubble
                                )}
                            >
                                {m.content}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <div className={styles.loadingIndicator}>
                            <Loader2 className={styles.loadingSpinner} />
                            <span className={styles.loadingText}>Generating...</span>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formContainer}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isAiAvailable === false ? "AI not available" : "Ask about your schedule..."}
                        className={styles.input}
                        disabled={isAiAvailable === false}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || isAiAvailable === false}
                        className={styles.button}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
}
