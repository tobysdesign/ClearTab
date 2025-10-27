'use client'

// Icons replaced with ASCII placeholders
import { useChatContext } from "@/hooks/use-chat-context"
import { Dock } from "@cleartab/ui"
import { Button } from "@cleartab/ui"
import styles from "./chat-dock.module.css"

export function ChatDock() {
    const { openChat } = useChatContext()

    return (
        <div className={styles.dockContainer}>
            <Dock>
                <Button variant="ghost-icon" size="icon" onClick={openChat}>
                    <span className={styles.icon}>•</span>
                </Button>
            </Dock>
        </div>
    )
} 