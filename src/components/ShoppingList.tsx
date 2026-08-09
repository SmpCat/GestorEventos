'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShoppingList, scanShoppingListAI } from '@/actions/shopping';
import ShoppingListCard from './ShoppingListCard';
import AiLoadingOverlay from './AiLoadingOverlay';
import SearchableUserSelect from './SearchableUserSelect';
import styles from './ShoppingList.module.css';

interface ShoppingListProps {
  lists: any[];
  eventId: string;
  users: any[];
  currentUser: any;
}

export default function ShoppingList({ lists, eventId, users, currentUser }: ShoppingListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Estado para modal de creación manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListAssignee, setNewListAssignee] = useState<string>('UNASSIGN');

  // Buscador global de listas / productos
  const [searchQuery, setSearchQuery] = useState('');

  const assignableUsers = users.filter(u => u.username !== 'admin' && u.name !== 'Administrador');

  // Handlers para Crear Lista Manual
  const handleCreateManualList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setLoading('create-list');
    const res = await createShoppingList(
      eventId, 
      newListName.trim(), 
      newListAssignee === 'UNASSIGN' ? null : newListAssignee
    );

    if (res.success) {
      setNewListName('');
      setNewListAssignee('UNASSIGN');
      setIsManualModalOpen(false);
      router.refresh();
    } else {
      alert(res.error || 'Error al crear la lista');
    }
    setLoading(null);
  };

  // Handlers para Cargar Foto con IA
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const listTitle = prompt('Nombre para la nueva lista escaneada:', `Lista Manuscrita (${new Date().toLocaleDateString('es-ES')})`);
    if (listTitle === null) return; // Cancelado por usuario

    setLoading('scanning');

    // Función auxiliar para comprimir la imagen en el cliente
    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1000;
            const MAX_HEIGHT = 1000;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl.split(',')[1]); 
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });
    };

    try {
      const base64Data = await compressImage(file);
      const res = await scanShoppingListAI(eventId, base64Data, 'image/jpeg', listTitle);
      
      if (res.success) {
        alert(`¡Éxito! Se ha creado la lista "${listTitle}" con ${res.count} productos extraídos por la IA.`);
        router.refresh();
      } else {
        alert(`Aviso: ${res.error}`);
        router.refresh();
      }
    } catch (err: any) {
      alert(`Error al procesar la imagen: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  // Filtrado de listas según búsqueda
  const filteredLists = lists.filter(list => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchesListName = list.name.toLowerCase().includes(q);
    const matchesAssignee = list.assignee?.name?.toLowerCase().includes(q);
    const matchesItem = (list.items || []).some((item: any) => item.name.toLowerCase().includes(q));
    return matchesListName || matchesAssignee || matchesItem;
  });

  return (
    <div className={styles.container}>
      <AiLoadingOverlay 
        isVisible={loading === 'scanning'} 
        title="Analizando Lista"
        message="Interpretando lista manuscrita con Inteligencia Artificial..." 
      />

      <div className={styles.headerRow}>
        <div>
          <h1>Listas de la Compra</h1>
          <p className="subtitle">Crea y gestiona múltiples listas organizadas para el evento activo.</p>
        </div>
      </div>

      {/* Bloque superior de acciones de creación */}
      <h3 className={`${styles.sectionTitle} ${styles.sectionTitleFirst}`}>➕ Crear Nueva Lista</h3>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <div className={styles.innerBlackBox}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Botón Crear Lista Manual */}
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontSize: '1rem' }}
            >
              <span style={{ fontSize: '1.2rem' }}>📝</span> + Nueva Lista Manual
            </button>

            <span style={{ opacity: 0.4 }}>o alternativamente</span>

            {/* Botón Crear Lista desde Foto (IA) */}
            <input 
              type="file" 
              accept="image/*" 
              id="ai-scanner-input" 
              style={{ display: 'none' }} 
              onChange={handleImageUpload} 
              disabled={loading === 'scanning'}
            />
            <button 
              type="button"
              className="btn"
              onClick={() => document.getElementById('ai-scanner-input')?.click()}
              disabled={loading === 'scanning'}
              style={{
                backgroundColor: 'var(--color-primary-transparent)',
                color: '#fff',
                border: '1px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                fontSize: '1rem',
                opacity: loading === 'scanning' ? 0.7 : 1
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>📸</span> Crear Lista desde Foto (IA)
            </button>
          </div>
        </div>
      </div>

      {/* Modal para Crear Lista Manual */}
      {isManualModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff' }}>📝 Crear Nueva Lista de la Compra</h3>
            <form onSubmit={handleCreateManualList}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.8)' }}>
                  Nombre de la lista:
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. Bebidas, Carnes, Limpieza..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.8)' }}>
                  Encargado asignado (Opcional):
                </label>
                <SearchableUserSelect
                  users={assignableUsers}
                  value={newListAssignee}
                  onChange={setNewListAssignee}
                  currentUserId={currentUser.id}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={loading === 'create-list'}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading === 'create-list' || !newListName.trim()}
                >
                  {loading === 'create-list' ? '⏳ Creando...' : 'Crear Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buscador global de listas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
          📋 Listas Registradas ({filteredLists.length})
        </h3>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Buscar lista o producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem', paddingRight: searchQuery ? '2rem' : '0.75rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Renderizado de las Listas */}
      {filteredLists.length > 0 ? (
        filteredLists.map((list) => (
          <ShoppingListCard
            key={list.id}
            list={list}
            users={users}
            currentUser={currentUser}
          />
        ))
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'rgba(255,255,255,0.5)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>No hay listas creadas</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {searchQuery ? 'Ninguna lista coincide con tu búsqueda.' : 'Crea tu primera lista manualmente o escanea una foto manuscrita.'}
          </p>
        </div>
      )}
    </div>
  );
}
