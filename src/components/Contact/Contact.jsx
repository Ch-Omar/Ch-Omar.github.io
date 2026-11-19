import React from "react";

import styles from "./Contact.module.css";
import { getImageUrl } from "../../utils";

export const Contact = () => {
  return (
    <footer id="contact" className={styles.container}>
      <div className={styles.text}>
        <h2>Contact</h2>
        <p>Open to front-end and mobile roles. Feel free to reach out!</p>
      </div>
      <ul className={styles.links}>
        <li className={styles.link}>
          <img src={getImageUrl("contact/emailIcon.png")} alt="Email" />
          <a href="mailto:omar.chakroun91@gmail.com">omar.chakroun91@gmail.com</a>
        </li>
        <li className={styles.link}>
          <img src={getImageUrl("contact/linkedinIcon.png")} alt="LinkedIn" />
          <a href="https://www.linkedin.com/in/omarchakroun">linkedin.com/in/omarchakroun</a>
        </li>
        <li className={styles.link}>
          <img src={getImageUrl("contact/githubIcon.png")} alt="GitHub" />
          <a href="https://github.com/Ch-Omar">github.com/Ch-Omar</a>
        </li>
      </ul>
    </footer>
  );
};
