'use client';

import { useState, useRef, useEffect } from 'react';

interface UserOption {
  id: string;
  name: string;
  username: string;
}

interface SearchableUserSelectProps {
  users: UserOption[];
  value: string | null;
  onChange: (userId: string) => void;
  currentUserId: string;
  disabled?: boolean;
}

export default function SearchableUserSelect({
  users,
  value,
  onChange,
  currentUserId,
  disabled = false
}: SearchableUserSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autoenfocar el campo de búsqueda al abrir el desplegable
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedUser = users.find(u => u.id === value);

  let labelText = 'Libre (Cualquiera)';
  if (value && value !== 'UNASSIGN') {
    if (value === currentUserId) {
      labelText = '🙋‍♂️ ¡Yo lo compro!';
    } else if (selectedUser) {
      labelText = `Asignar a: ${selectedUser.name} (@${selectedUser.username})`;
    }
  }

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  const handleSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Botón selector principal */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="input-field"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.45rem 0.75rem',
          fontSize: '0.85rem',
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          color: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {labelText}
        </span>
        <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.5rem' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Menú desplegable flotante con buscador en la parte superior */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.85), 0 0 1px rgba(255,255,255,0.3)',
            padding: '0.5rem',
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            backdropFilter: 'blur(16px)'
          }}
        >
          {/* BUSCADOR AL PRINCIPIO DE LA LISTA DE PERSONAS */}
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              ref={searchInputRef}
              type="text"
              className="input-field"
              placeholder="🔍 Buscar por nombre o nick..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                fontSize: '0.85rem',
                padding: '0.4rem 0.6rem 0.4rem 2rem',
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                borderRadius: '6px',
                color: '#fff'
              }}
            />
            <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '0.85rem', pointerEvents: 'none' }}>
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Lista de personas filtrada */}
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              type="button"
              onClick={() => handleSelect('UNASSIGN')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.4rem 0.6rem',
                fontSize: '0.85rem',
                borderRadius: '6px',
                background: (!value || value === 'UNASSIGN') ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color: (!value || value === 'UNASSIGN') ? '#93c5fd' : 'rgba(255,255,255,0.9)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: (!value || value === 'UNASSIGN') ? 'bold' : 'normal'
              }}
            >
              Libre (Cualquiera)
            </button>

            {filteredUsers.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', padding: '0.5rem', textAlign: 'center', fontStyle: 'italic' }}>
                No se encontraron personas con ese nombre o nick.
              </p>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = value === u.id;
                const isSelf = u.id === currentUserId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(59, 130, 248, 0.25)' : 'transparent',
                      color: isSelected ? '#93c5fd' : '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontWeight: isSelf ? 'bold' : 'normal' }}>
                      {isSelf ? '🙋‍♂️ ¡Yo lo compro!' : u.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                      @{u.username}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
