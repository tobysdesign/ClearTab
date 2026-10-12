import { DemoEmbed } from './demo-embed'
import styles from './hero-demo.module.css'

/*
 * Hero: the real dashboard in a browser window, playing the hero story (record a voice memo,
 * it becomes a note, highlight part of it, the AI turns it into tasks). See components/demo.
 */
export function HeroDemo() {
  return (
    <div className={styles.frame}>
      <div className={styles.chrome} aria-hidden="true">
        <span className={styles.lights}>
          <span />
          <span />
          <span />
        </span>
        <span className={styles.url}>cleartab.app/tab</span>
      </div>
      <DemoEmbed story="hero" title="ClearTab: a voice memo turned into a note, then into tasks by the AI" />
    </div>
  )
}
