import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useExpandableCard, Card } from './expandable-card-context'
import styles from './expandable-card-modal.module.css'
import { ClientOnly } from './safe-motion'

interface Props {
  card: Card
}

export const ExpandableCardModal: React.FC<Props> = ({ card }) => {
  const { setActive } = useExpandableCard()
  return (
    <ClientOnly>
      <AnimatePresence>
        {card && (
          <>
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.overlay}
              onClick={() => setActive(null)}
            />
            <div className={styles.container}>
              <motion.button
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className={styles.closeBtn}
                onClick={() => setActive(null)}
              >
                ✕
              </motion.button>
              <motion.div layoutId={`card-${card.title}`} className={styles.modal}>
                {card.src && (
                  <motion.img
                    layoutId={`image-${card.title}`}
                    src={card.src}
                    alt={card.title}
                    className={styles.image}
                  />
                )}
                <div className={styles.padding}>
                  <motion.h3 layoutId={`title-${card.title}`} className={styles.title}>
                    {card.title}
                  </motion.h3>
                  <motion.p layoutId={`description-${card.description}`} className={styles.description}>
                    {card.description}
                  </motion.p>
                  {card.content && <div className={styles.content}>{typeof card.content === 'function' ? card.content() : card.content}</div>}
                  {card.ctaText && (
                    <motion.a layoutId={`button-${card.title}`} href={card.ctaLink} target="_blank" className={styles.cta}>
                      {card.ctaText}
                    </motion.a>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ClientOnly>
  )
}