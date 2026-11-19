import React from "react";

import styles from './Hero.module.css';
import { getImageUrl } from "../../utils";

const STATS = [
  { value: "8+", label: "years building apps" },
  { value: "5", label: "companies" },
  { value: "Web + Mobile", label: "React · Next.js · React Native" },
];

export const Hero = () => {
  return (
    <section className={styles.container}>
      <div className={styles.content}>
        <p className={styles.kicker}>Senior Front-end &amp; Mobile Developer · Tunisia</p>
        <h1 className={styles.title}>Hi, I&apos;m Omar</h1>
        <p className={styles.description}>
          I build fast, responsive web and mobile apps with JavaScript, React,
          Next.js and React Native, from healthcare platforms to ed-tech and games.
        </p>
        <ul className={styles.stats}>
          {STATS.map((s) => (
            <li key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <a href="#contact" className={styles.contactBtn}>Contact Me</a>
          <a href="/games/" className={styles.secondaryBtn}>Play my games</a>
        </div>
      </div>
      <img src={getImageUrl("hero/heroImage.png")} alt="" className={styles.heroImg} />
      <div className={styles.topBlur} />
      <div className={styles.bottomBlur} />
    </section>
  );
};
