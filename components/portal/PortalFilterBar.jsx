import styles from './PortalFilterBar.module.css';

export default function PortalFilterBar({ children, onSubmit, label }) {
  return <form className={`form-card ${styles.filters}`} onSubmit={onSubmit} aria-label={label}>{children}</form>;
}
