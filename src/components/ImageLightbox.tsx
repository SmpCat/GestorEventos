'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Deshabilitar el scroll del body mientras el lightbox está abierto
    if (imageUrl) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [imageUrl]);

  if (!imageUrl || !mounted) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      {/* Botón Cerrar (X) arriba a la derecha */}
      <button 
        type="button"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: '#ffffff',
          fontSize: '1.8rem',
          lineHeight: '1',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000000,
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}
        title="Cerrar"
      >
        ✕
      </button>

      {/* Imagen completa en su aspecto original ajustada al alto/ancho de la pantalla */}
      <img 
        src={imageUrl} 
        alt="Foto manuscrita lista" 
        style={{
          maxWidth: '92vw',
          maxHeight: '88vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: '16px',
          boxShadow: '0 15px 50px rgba(0,0,0,0.8)'
        }}
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
