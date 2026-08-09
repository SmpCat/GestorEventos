import React from 'react';
import styles from './AiLoadingOverlay.module.css';

interface AiLoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  message?: string;
}

export default function AiLoadingOverlay({ isVisible, title = "Analizando Imagen", message = "Extrayendo información con IA..." }: AiLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={`glass-panel ${styles.modal}`}>
        <div className={styles.scannerContainer}>
          <div className={styles.receipt}>
            <div className={styles.line}></div>
            <div className={styles.line}></div>
            <div className={styles.line}></div>
            <div className={styles.line}></div>
            <div className={styles.line}></div>
          </div>
          <div className={styles.laser}></div>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{message}</p>
        <div className={styles.pulseDots}>
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );
}
