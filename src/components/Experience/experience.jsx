import React from 'react';

import styles from "./Experience.module.css"
import skills from '../../data/skills.json';
import history from '../../data/history.json';

const initials = name => name.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).join('').slice(0, 2) || name[0];

export const Experience = () => {
  return (
    <section className={styles.container} id='experience'>
        <h2 className={styles.title}>Experience</h2>
        <div className={styles.content}>
            <div className={styles.skills}>
                {skills.map(group => (
                    <div key={group.group} className={styles.skillGroup}>
                        <h3>{group.group}</h3>
                        <ul>
                            {group.items.map(item => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
            <ul className={styles.history}>
                {history.map((item, id) => (
                    <li key={id} className={styles.historyItem}>
                        <span className={styles.logo} aria-hidden="true">{initials(item.organization)}</span>
                        <div className={styles.historyItemDetails}>
                            <h3>{item.role}</h3>
                            <p className={styles.org}>{item.organization} · {item.place}</p>
                            <p className={styles.dates}>{`${item.startDate} – ${item.endDate}`}</p>
                            <ul>
                                {item.experiences.map((line, k) => <li key={k}>{line}</li>)}
                            </ul>
                            <div className={styles.tech}>
                                {item.tech.map(t => <span key={t}>{t}</span>)}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </section>
  )
}
