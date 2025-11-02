'use client'

// Icons replaced with ASCII placeholders
import { useChatContext } from "@/hooks/use-chat-context"
import { Button } from "@cleartab/ui"
import styles from "./chat-dock.module.css"

export function ChatDock() {
    const { openChat } = useChatContext()

    return (
        <div className={styles.dockContainer}>
            <div className={styles.dock}>
                <Button variant="ghost-icon" size="icon" onClick={openChat}>
                    <span className={styles.icon}>•</span>
                </Button>
            </div>
        </div>
    )
} 