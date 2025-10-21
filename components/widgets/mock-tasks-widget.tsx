'use client'

import styles from './tasks-widget.module.css'

export function MockTasksWidget() {
  const mockTasks = [
    {
      id: '1',
      title: 'Review project proposal',
      completed: false,
      important: true,
      due_date: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: '2',
      title: 'Team standup meeting',
      completed: true,
      important: false,
      due_date: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Update documentation',
      completed: false,
      important: false,
      due_date: new Date(Date.now() + 172800000).toISOString(),
    },
    {
      id: '4',
      title: 'Client presentation prep',
      completed: false,
      important: true,
      due_date: new Date(Date.now() + 259200000).toISOString(),
    }
  ]

  const pendingTasks = mockTasks.filter(task => !task.completed)
  const completedTasks = mockTasks.filter(task => task.completed)

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tasks</h2>
        <span className={styles.count}>{pendingTasks.length}</span>
      </div>

      <div className={styles.content}>
        {pendingTasks.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Pending ({pendingTasks.length})</h3>
            <div className={styles.tasksList}>
              {pendingTasks.map((task) => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={styles.taskContent}>
                    <div className={styles.taskHeader}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        disabled
                        className={styles.taskCheckbox}
                      />
                      <span className={`${styles.taskTitle} ${task.important ? styles.important : ''}`}>
                        {task.title}
                      </span>
                    </div>
                    {task.due_date && (
                      <span className={styles.taskDue}>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Completed ({completedTasks.length})</h3>
            <div className={styles.tasksList}>
              {completedTasks.map((task) => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={styles.taskContent}>
                    <div className={styles.taskHeader}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        disabled
                        className={styles.taskCheckbox}
                      />
                      <span className={`${styles.taskTitle} ${styles.completed}`}>
                        {task.title}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}