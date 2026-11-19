import React from "react";
import PropTypes from "prop-types";

import styles from "./ProjectCard.module.css";

export const ProjectCard = ({
  project: { title, label, color, description, skills, demo, demoLabel, source },
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.banner} style={{ background: `linear-gradient(135deg, ${color} 0%, #132a53 110%)` }}>
        <span>{label}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <ul className={styles.skills}>
        {skills.map((skill, id) => (
          <li key={id} className={styles.skill}>{skill}</li>
        ))}
      </ul>
      {(demo || source) && (
        <div className={styles.links}>
          {demo && <a href={demo} className={styles.link}>{demoLabel || "Demo"}</a>}
          {source && <a href={source} className={styles.link}>Source</a>}
        </div>
      )}
    </div>
  );
};

ProjectCard.propTypes = {
  project: PropTypes.shape({
    title: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    skills: PropTypes.arrayOf(PropTypes.string).isRequired,
    demo: PropTypes.string,
    demoLabel: PropTypes.string,
    source: PropTypes.string,
  }).isRequired,
};
