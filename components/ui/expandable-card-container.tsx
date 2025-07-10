import React from 'react'
import { ExpandableCardProvider, useExpandableCard, Card } from './expandable-card-context'
import { ExpandableCardModal } from './expandable-card-modal'
import { ExpandableCardListItem } from './expandable-card-list-item'
import styles from './expandable-card-container.module.css'

interface Props {
  cards: Card[]
}

const Inner: React.FC<Props> = ({ cards }) => {
  const { active } = useExpandableCard()
  return (
    <>
      {active && <ExpandableCardModal card={active} />}
      <ul className={styles.list}>
        {cards.map(card => (
          <ExpandableCardListItem key={card.title} card={card} />
        ))}
      </ul>
    </>
  )
}

export const ExpandableCardContainer: React.FC<Props> = ({ cards }) => (
  <ExpandableCardProvider>
    <Inner cards={cards} />
  </ExpandableCardProvider>
)