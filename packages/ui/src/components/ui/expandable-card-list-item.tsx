import React from 'react'
import { motion } from 'framer-motion'
import { Card, useExpandableCard } from './expandable-card-context'
import styles from './expandable-card-list-item.module.css'
import { ClientOnly } from './safe-motion'

interface Props {
  card: Card
}

export const ExpandableCardListItem: React.FC<Props> = ({ card }) => {
  const { setActive } = useExpandableCard()
  return (
    <ClientOnly>
      <motion.div
        layoutId={`card-${card.title}`}
        className={styles.item}
        onClick={() => setActive(card)}
      >
        <div className={styles.content}>
          {card.src && (
            <motion.img
              layoutId={`image-${card.title}`}
              src={card.src}
              alt={card.title}
              className={styles.image}
            />
          )}
          <div>
            <motion.h3 layoutId={`title-${card.title}`} className={styles.title}>
              {card.title}
            </motion.h3>
            <motion.p layoutId={`description-${card.description}`} className={styles.description}>
              {card.description}
            </motion.p>
          </div>
        </div>
        {card.ctaText && (
          <motion.button layoutId={`button-${card.title}`} className={styles.cta}>
            {card.ctaText}
          </motion.button>
        )}
      </motion.div>
    </ClientOnly>
  )
}