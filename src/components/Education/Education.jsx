import React from "react";

import styles from "./Education.module.css";
import data from "../../data/education.json";

export const Education = () => {
  return (
    <section className={styles.container} id="education">
      <h2 className={styles.title}>Education</h2>
      <div className={styles.content}>
        <ul className={styles.list}>
          {data.education.map((e) => (
            <li key={e.title} className={styles.item}>
              <div>
                <h3>{e.title}</h3>
                <p>{e.school} · {e.place}</p>
                {e.note && <p className={styles.note}>{e.note}</p>}
              </div>
              <span className={styles.date}>{e.date}</span>
            </li>
          ))}
        </ul>
        <div className={styles.languages}>
          <h3>Languages</h3>
          <ul>
            {data.languages.map((l) => (
              <li key={l.name}><b>{l.name}</b><span>{l.level}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
