import { CheckIcon, SparkleIcon, ReplyIcon, LabelImportantIcon } from '@/components/icons'
import styles from './demos.module.css'

/* Looping product demos for the landing page. Pure CSS animation;
   each tile is its own container so positions are in cqw. */

function Cursor() {
  return (
    <svg className={styles.cursorSvg} viewBox="0 0 16 22" width="16" height="22" aria-hidden="true">
      <path
        d="M1 1v17.5l4.6-4.4 2.9 6.6 2.7-1.2-2.9-6.4H15L1 1Z"
        fill="#f4f4f5"
        stroke="#161616"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function NotesDemo() {
  return (
    <div className={`${styles.tile} ${styles.notesTile}`} aria-hidden="true">
      <div className={styles.noteCard}>
        <p className={styles.noteTitle}>Hobart trip</p>
        <p className={`${styles.noteLine} ${styles.line1}`}>Ferry to MONA on Saturday</p>
        <p className={`${styles.noteLine} ${styles.line2}`}>Salamanca market, early</p>
        <p className={`${styles.noteLine} ${styles.line3}`}>Pack the warm jacket</p>
        <span className={styles.saved}>Saved</span>
      </div>
    </div>
  )
}

/* A note becomes tasks with AI (one flagged important), then one gets ticked off. 10s loop. */
export function TasksDemo() {
  const tasks = [
    { text: 'Call the plumber', due: 'Today', important: true },
    { text: "Book Mum's flights", due: 'Fri', important: false },
    { text: 'Water the plants', due: '', important: false },
  ]
  return (
    <div className={`${styles.tile} ${styles.tasksTile}`} aria-hidden="true">
      <div className={styles.sourceNote}>
        <p className={styles.sourceText}>
          Leak under the sink is getting worse, call the plumber today! Mum&apos;s visiting, book her flights by
          Friday. Water the plants.
        </p>
        <span className={styles.makeTasks}>
          <SparkleIcon size={10} />
          Make tasks
        </span>
      </div>
      <div className={styles.taskList}>
        {tasks.map((task, i) => (
          <div key={task.text} className={`${styles.taskRow} ${styles[`task${i + 1}`]}`}>
            <span className={styles.checkbox}>
              <CheckIcon size={12} className={styles.check} />
            </span>
            <span className={styles.taskText}>{task.text}</span>
            <span className={styles.taskMeta}>
              {task.important && <LabelImportantIcon size={12} className={styles.priority} />}
              {task.due}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.taskCursor}>
        <Cursor />
      </div>
    </div>
  )
}

export function ScheduleDemo() {
  return (
    <div className={`${styles.tile} ${styles.scheduleTile}`} aria-hidden="true">
      <div className={styles.timeline}>
        {['9', '10', '11', '12', '1'].map((hour) => (
          <span key={hour} className={styles.hour}>{hour}</span>
        ))}
        <div className={`${styles.block} ${styles.blockA}`}>
          <span>Standup</span>
        </div>
        <div className={`${styles.block} ${styles.blockB}`}>
          <span>Deep work</span>
        </div>
        <div className={`${styles.block} ${styles.blockC}`}>
          <span>Lunch</span>
        </div>
        <div className={styles.nowLine} />
      </div>
    </div>
  )
}

export function AskDemo() {
  return (
    <div className={`${styles.tile} ${styles.askTile}`} aria-hidden="true">
      <div className={styles.askPanel}>
        <p className={styles.askQuestion}>What&apos;s due this week?</p>
        <p className={styles.askThinking}>
          <SparkleIcon size={12} />
          <span>Thinking</span>
        </p>
        <div className={styles.askAnswer}>
          <p className={styles.askThought}>
            <SparkleIcon size={10} />
            Thought for 1 second
          </p>
          <p className={styles.askText}>
            Three things: the <strong>electricity bill</strong> on Wednesday,
            Priya&apos;s <strong>proposal review</strong> on Thursday and
            <strong> Mum&apos;s birthday</strong> on Saturday.
          </p>
        </div>
        <div className={styles.askFollowUps}>
          <span className={styles.followUp}><ReplyIcon size={10} />Remind me about the bill</span>
          <span className={styles.followUp}><ReplyIcon size={10} />Add a gift idea note</span>
        </div>
      </div>
    </div>
  )
}

const PRESETS = [
  { id: 'notetaker', name: 'Notetaker' },
  { id: 'even', name: 'Even' },
  { id: 'taskmaster', name: 'Taskmaster' },
  { id: 'minimal', name: 'Minimal' },
] as const

const PRESET_BLOCKS: Record<(typeof PRESETS)[number]['id'], string[]> = {
  notetaker: ['Notes', 'Tasks', 'Schedule', 'Weather'],
  even: ['Notes', 'Tasks', 'Schedule', 'Weather', 'Countdown', 'Voice'],
  taskmaster: ['Tasks', 'Notes', 'Schedule', 'Weather', 'Countdown'],
  minimal: ['Notes', 'Tasks'],
}

/* Cycles through the layout presets, one every 3s */
export function LayoutsDemo() {
  return (
    <div className={`${styles.tile} ${styles.layoutsTile}`} aria-hidden="true">
      <div className={styles.presetList}>
        {PRESETS.map((preset) => (
          <span key={preset.id} className={styles.presetName}>{preset.name}</span>
        ))}
        <span className={styles.presetCustom}>+ Custom</span>
      </div>
      <div className={styles.wireStage}>
        {PRESETS.map((preset) => (
          <div key={preset.id} className={`${styles.wire} ${styles[`wire_${preset.id}`]}`}>
            {PRESET_BLOCKS[preset.id].map((block) => (
              <span key={block} className={`${styles.wireBlock} ${styles[`area${block}`]}`}>{block}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Two Google accounts merged into one schedule; Personal switches off, then back on */
export function CalendarsDemo() {
  return (
    <div className={`${styles.tile} ${styles.calendarsTile}`} aria-hidden="true">
      <div className={styles.accounts}>
        <div className={styles.account}>
          <span className={`${styles.accountDot} ${styles.work}`} />
          <span className={styles.accountName}>Work</span>
          <span className={`${styles.switch} ${styles.switchOn}`}><span /></span>
        </div>
        <div className={styles.account}>
          <span className={`${styles.accountDot} ${styles.personal}`} />
          <span className={styles.accountName}>Personal</span>
          <span className={`${styles.switch} ${styles.switchAnimated}`}><span /></span>
        </div>
      </div>
      <div className={styles.calEvents}>
        <div className={`${styles.calEvent} ${styles.work}`}>
          <span className={styles.calName}>Sprint planning</span>
          <span className={styles.calTime}>9:30</span>
        </div>
        <div className={`${styles.calEvent} ${styles.personal} ${styles.personalEvent}`}>
          <span className={styles.calName}>Gym</span>
          <span className={styles.calTime}>12:15</span>
        </div>
        <div className={`${styles.calEvent} ${styles.work}`}>
          <span className={styles.calName}>1:1 with Alex</span>
          <span className={styles.calTime}>2:00</span>
        </div>
        <div className={`${styles.calEvent} ${styles.personal} ${styles.personalEvent}`}>
          <span className={styles.calName}>Pick up Leo</span>
          <span className={styles.calTime}>4:45</span>
        </div>
      </div>
    </div>
  )
}

/* The dock moves around the edges of a mini dashboard */
export function DockDemo() {
  return (
    <div className={`${styles.tile} ${styles.dockTile}`} aria-hidden="true">
      <div className={styles.dockScreen}>
        <span className={styles.dockBlock} />
        <span className={styles.dockBlock} />
        <span className={styles.dockBlock} />
        <span className={styles.dockBlock} />
        <span className={`${styles.miniDock} ${styles.dockBottom}`}><i /><i /><i /></span>
        <span className={`${styles.miniDock} ${styles.dockLeft}`}><i /><i /><i /></span>
        <span className={`${styles.miniDock} ${styles.dockTop}`}><i /><i /><i /></span>
        <span className={`${styles.miniDock} ${styles.dockRight}`}><i /><i /><i /></span>
      </div>
    </div>
  )
}
