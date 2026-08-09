import React from 'react';
import styles from './AiLoadingOverlay.module.css';

interface AiLoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  onCancel?: () => void;
}

export default function AiLoadingOverlay({ isVisible, title = "Analizando Imagen", message = "Extrayendo información con IA...", onCancel }: AiLoadingOverlayProps) {
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
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              marginTop: '1.5rem',
              padding: '0.5rem 1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            ✕ Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
