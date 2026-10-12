import { CheckIcon, SparkleIcon, EyesMarkIcon, SearchIcon, SettingsIcon, LockIcon } from '@/components/icons'
import styles from './hero-demo.module.css'

/*
 * A miniature ClearTab dashboard that plays one scripted loop (14s):
 * the cursor ticks off a task, writes a note, then asks the AI chat
 * a question. Every size is in container units so the cursor's
 * percentage path lands on the same targets at any width.
 */

const DOTS = Array.from({ length: 24 }, (_, i) => i)

export function HeroDemo() {
  return (
    <div className={styles.frame} aria-hidden="true">
      <div className={styles.chrome}>
        <span className={styles.lights}>
          <span />
          <span />
          <span />
        </span>
        <span className={styles.url}>cleartab.app/tab</span>
      </div>

      <div className={styles.screen}>
        <div className={styles.grid}>
          {/* Notes */}
          <div className={`${styles.tile} ${styles.notes}`}>
            <div className={styles.noteList}>
              <p className={styles.tileTitle}>Notes</p>
              <div className={`${styles.noteItem} ${styles.noteItemActive}`}>
                <span className={styles.noteName}>Weekend</span>
                <span className={styles.noteMeta}>Today</span>
              </div>
              <div className={styles.noteItem}>
                <span className={styles.noteName}>Book ideas</span>
                <span className={styles.noteMeta}>Mon</span>
              </div>
              <div className={styles.noteItem}>
                <span className={styles.noteName}>Recipes</span>
                <span className={styles.noteMeta}>2 Oct</span>
              </div>
            </div>
            <div className={styles.noteEditor}>
              <p className={styles.noteHeading}>Weekend</p>
              <p className={styles.noteLine}>Farmers market at 9, then swim.</p>
              <p className={`${styles.noteLine} ${styles.typedLine}`}>Call Mum about Sunday lunch</p>
            </div>
          </div>

          {/* Tasks */}
          <div className={`${styles.tile} ${styles.tasks}`}>
            <p className={styles.tileTitle}>Tasks</p>
            <div className={styles.taskRow}>
              <span className={styles.checkbox} />
              <span className={styles.taskText}>Renew passport</span>
              <span className={styles.taskDate}>14/10</span>
            </div>
            <div className={`${styles.taskRow} ${styles.taskAnimated}`}>
              <span className={styles.checkbox}>
                <CheckIcon size={10} className={styles.checkMark} />
              </span>
              <span className={styles.taskText}>Send invoice</span>
              <span className={styles.taskDate}>Today</span>
            </div>
            <div className={styles.taskRow}>
              <span className={styles.checkbox} />
              <span className={styles.taskText}>Book dentist</span>
              <span className={styles.taskDate}>20/10</span>
            </div>
          </div>

          {/* Weather */}
          <div className={`${styles.tile} ${styles.weather}`}>
            <p className={styles.tileTitle}>Sydney</p>
            <p className={styles.temp}>23°</p>
            <p className={styles.tileMeta}>Mostly sunny</p>
          </div>

          {/* Countdown */}
          <div className={`${styles.tile} ${styles.countdown}`}>
            <div className={styles.dots}>
              {DOTS.map((i) => (
                <span key={i} className={i < 15 ? styles.dot : `${styles.dot} ${styles.dotFilled}`} />
              ))}
            </div>
            <p className={styles.countNumber}>9</p>
            <p className={styles.tileMeta}>Days until <strong>Holiday</strong></p>
          </div>

          {/* Schedule */}
          <div className={`${styles.tile} ${styles.schedule}`}>
            <div className={styles.scheduleDay}>
              <span className={styles.scheduleWeekday}>Fri</span>
              <span className={styles.scheduleDate}>10</span>
            </div>
            <div className={styles.events}>
              <div className={`${styles.event} ${styles.eventNow}`}>
                <span className={styles.eventName}>Design review</span>
                <span className={styles.eventTime}>10:00 – 10:45</span>
              </div>
              <div className={styles.event}>
                <span className={styles.eventName}>Lunch with Sam</span>
                <span className={styles.eventTime}>12:30 – 1:30</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat reply that pops above the dock */}
        <div className={styles.chat}>
          <p className={styles.chatQuestion}>What&apos;s left today?</p>
          <p className={styles.chatThinking}>
            <SparkleIcon size={9} />
            <span>Thinking</span>
          </p>
          <p className={styles.chatAnswer}>Just two: renew your passport and book the dentist.</p>
          <p className={styles.chatPrivate}>
            <LockIcon size={9} />
            <span>Answered on your device</span>
          </p>
        </div>

        <div className={styles.dock}>
          <span className={styles.dockIcon}><SearchIcon size={12} /></span>
          <span className={`${styles.dockIcon} ${styles.dockAi}`}><EyesMarkIcon size={18} /></span>
          <span className={styles.dockIcon}><SettingsIcon size={12} /></span>
        </div>

        <div className={styles.cursorTrack}>
          <svg className={styles.cursor} viewBox="0 0 16 22" width="16" height="22">
            <path
              d="M1 1v17.5l4.6-4.4 2.9 6.6 2.7-1.2-2.9-6.4H15L1 1Z"
              fill="#f4f4f5"
              stroke="#161616"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
