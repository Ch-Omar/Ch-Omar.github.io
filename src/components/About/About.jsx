import React from "react";

import styles from "./About.module.css";
import { getImageUrl } from "../../utils";

export const About = () => {
  return (
    <section className={styles.container} id="about">
      <h2 className={styles.title}>About</h2>
      <div className={styles.content}>
        <img className={styles.aboutImg} src={getImageUrl("about/aboutImage.png")} alt="About image" />
        <ul  className={styles.aboutItems}>
          <li className={styles.aboutItem}>
            <img className={styles.iconImg} src={getImageUrl("about/cursorIcon.png")} />
            <div  className={styles.aboutItemText}>
              <h3>Frontend Developer</h3>
              <p>
                I&apos;m a front-end developer with experience in building
                responsive and optimized sites
              </p>
            </div>
          </li>
          <li className={styles.aboutItem}>
            <img className={styles.iconImg} src={getImageUrl("about/serverIcon.png")} />
            <div className={styles.aboutItemText}>
              <h3>Backend Developer</h3>
              <p>
                I have experience developing fast and optimized back-end systems
                and APIs
              </p>
            </div>
          </li>
          <li className={styles.aboutItem}>
            <img className={styles.iconImg} src={getImageUrl("about/uiIcon.png")} />
            <div className={styles.aboutItemText}>
              <h3>UI Designer</h3>
              <p>
                I hce designed multiple landing pages and have created design
                systems as well
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
};
