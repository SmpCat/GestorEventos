import React from 'react';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  if (!imageUrl) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
          fontSize: '2rem',
          lineHeight: '1',
          width: '50px',
          height: '50px',
          borderRadius: '25px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100000
        }}
      >
        &times;
      </button>
      <img 
        src={imageUrl} 
        alt="Ampliación" 
        style={{
          maxWidth: '100%',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()} // Previene cerrar al tocar la foto
      />
    </div>
  );
}
