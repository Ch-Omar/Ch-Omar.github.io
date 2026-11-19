import React from "react";

import styles from "./About.module.css";
import { getImageUrl } from "../../utils";

export const About = () => {
  return (
    <section className={styles.container} id="about">
      <h2 className={styles.title}>About</h2>
      <div className={styles.content}>
        <img className={styles.aboutImg} src={getImageUrl("about/aboutImage.png")} alt="" />
        <ul className={styles.aboutItems}>
          <li className={styles.aboutItem}>
            <img className={styles.iconImg} src={getImageUrl("about/cursorIcon.png")} alt="" />
            <div className={styles.aboutItemText}>
              <h3>Front-end Developer</h3>
              <p>
                8+ years building responsive, fast web apps with React and Next.js,
                from small business sites to a full healthcare platform.
              </p>
            </div>
          </li>
          <li className={styles.aboutItem}>
            <img className={styles.iconImg} src={getImageUrl("about/uiIcon.png")} alt="" />
            <div className={styles.aboutItemText}>
              <h3>Mobile Developer</h3>
              <p>
                React Native apps for Android and iOS, and my own Unity puzzle
                game, PaintDrop.
              </p>
            </div>
          </li>
          <li className={styles.aboutItem}>
            <img className={styles.iconImg} src={getImageUrl("about/serverIcon.png")} alt="" />
            <div className={styles.aboutItemText}>
              <h3>APIs &amp; Back-end</h3>
              <p>
                Node.js and Meteor.js with MongoDB, WordPress REST APIs, Symfony
                API integration, secure payments and Firebase.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
};
