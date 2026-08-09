'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  updateShoppingList, 
  deleteShoppingList, 
  addShoppingItemToList, 
  togglePurchased, 
  updateShoppingItem, 
  deleteItem 
} from '@/actions/shopping';
import TrashIcon from './TrashIcon';
import PencilIcon from './PencilIcon';
import SearchableUserSelect from './SearchableUserSelect';
import ImageLightbox from './ImageLightbox';
import styles from './ShoppingList.module.css';

interface ShoppingListCardProps {
  list: any;
  users: any[];
  currentUser: any;
}

export default function ShoppingListCard({ list, users, currentUser }: ShoppingListCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  // Edición del nombre de la lista
  const [isEditingListName, setIsEditingListName] = useState(false);
  const [listName, setListName] = useState(list.name);

  // Formulario de nuevo producto en esta lista
  const [newItemName, setNewItemName] = useState('');

  // Edición de un producto individual
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');

  // Lightbox de la foto de la lista
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const assignableUsers = users.filter(u => u.username !== 'admin' && u.name !== 'Administrador');

  const pendingItems = (list.items || []).filter((i: any) => !i.isPurchased);
  const purchasedItems = (list.items || []).filter((i: any) => i.isPurchased);

  // --- Handlers de la Lista ---
  const handleSaveListName = async () => {
    if (!listName.trim()) return;
    setLoading('save-list-name');
    const res = await updateShoppingList(list.id, listName.trim(), list.assigneeId);
    if (res.success) {
      setIsEditingListName(false);
      router.refresh();
    } else {
      alert(res.error || 'Error al actualizar nombre de la lista');
    }
    setLoading(null);
  };

  const handleAssignList = async (userId: string) => {
    setLoading('assign-list');
    await updateShoppingList(list.id, list.name, userId === 'UNASSIGN' ? null : userId);
    router.refresh();
    setLoading(null);
  };

  const handleDeleteList = async () => {
    if (window.confirm(`⚠️ ¿Seguro que quieres borrar la lista "${list.name}" y todos sus productos?`)) {
      setLoading('delete-list');
      await deleteShoppingList(list.id);
      router.refresh();
      setLoading(null);
    }
  };

  // --- Handlers de Productos ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setLoading('add-item');
    const res = await addShoppingItemToList(list.id, newItemName.trim(), currentUser.id);
    if (res.success) {
      setNewItemName('');
      router.refresh();
    } else {
      alert(res.error || 'Error al añadir producto');
    }
    setLoading(null);
  };

  const handleTogglePurchased = async (itemId: string, currentStatus: boolean) => {
    setLoading(`toggle-${itemId}`);
    await togglePurchased(itemId, !currentStatus, currentUser.id);
    router.refresh();
    setLoading(null);
  };

  const handleSaveItemEdit = async (itemId: string) => {
    if (!editingItemName.trim()) return;
    setLoading(`save-item-${itemId}`);
    const res = await updateShoppingItem(itemId, editingItemName.trim());
    if (res.success) {
      setEditingItemId(null);
      setEditingItemName('');
      router.refresh();
    } else {
      alert(res.error || 'Error al editar producto');
    }
    setLoading(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('¿Borrar este producto?')) {
      setLoading(`delete-item-${itemId}`);
      await deleteItem(itemId);
      router.refresh();
      setLoading(null);
    }
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
      <div className={styles.innerBlackBox}>
        {/* Cabecera de la Lista */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: isExpanded ? '0.75rem' : '0', borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
            {/* Botón Flecha Desplegable 🔽 / 🔼 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              title={isExpanded ? 'Plegar lista' : 'Desplegar lista'}
            >
              {isExpanded ? '🔼' : '🔽'}
            </button>

            {/* Nombre de la Lista */}
            {isEditingListName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flex: 1 }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '1rem', fontWeight: 600 }}
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveListName();
                    if (e.key === 'Escape') setIsEditingListName(false);
                  }}
                  autoFocus
                />
                <button onClick={handleSaveListName} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem' }}>✓</button>
                <button onClick={() => setIsEditingListName(false)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>
                  {list.name}
                </h3>
                <button 
                  onClick={() => { setIsEditingListName(true); setListName(list.name); }} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.9rem' }}
                  title="Renombrar lista"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>

          {/* Controles de la derecha de la lista: Encargado, Foto mini y Borrar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Foto miniaturizada si proviene de escaneo */}
            {list.imageUrl && (
              <button
                type="button"
                onClick={() => setLightboxImage(list.imageUrl)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Ver foto de la lista"
              >
                <img src={list.imageUrl} alt="Foto lista" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>📷 Ver Foto</span>
              </button>
            )}

            {/* Asignación de Encargado a nivel de Lista */}
            <div style={{ minWidth: '180px' }}>
              <SearchableUserSelect
                users={assignableUsers}
                value={list.assigneeId || 'UNASSIGN'}
                onChange={handleAssignList}
                currentUserId={currentUser.id}
                disabled={loading === 'assign-list'}
              />
            </div>

            {/* Botón Borrar Lista */}
            <button
              onClick={handleDeleteList}
              disabled={loading === 'delete-list'}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.35rem 0.6rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              title="Borrar esta lista"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Cuerpo Desplegable de la Lista */}
        {isExpanded && (
          <div style={{ marginTop: '1rem' }}>
            {/* Formulario Añadir Producto a esta Lista */}
            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder={`+ Añadir producto a "${list.name}"...`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                disabled={loading === 'add-item'}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading === 'add-item' || !newItemName.trim()}
                style={{ whiteSpace: 'nowrap' }}
              >
                {loading === 'add-item' ? '⏳' : '+ Añadir'}
              </button>
            </form>

            {/* Resumen contador */}
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.75rem' }}>
              Pendientes: {pendingItems.length} | Comprados: {purchasedItems.length}
            </div>

            {/* Lista de Productos */}
            {list.items && list.items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {list.items.map((item: any) => {
                  const isEditingThisItem = editingItemId === item.id;
                  const isItemProcessing = loading === `toggle-${item.id}` || loading === `save-item-${item.id}` || loading === `delete-item-${item.id}`;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: item.isPurchased ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        opacity: item.isPurchased ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={item.isPurchased}
                          onChange={() => handleTogglePurchased(item.id, item.isPurchased)}
                          disabled={isItemProcessing}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />

                        {isEditingThisItem ? (
                          <div style={{ display: 'flex', gap: '0.3rem', flex: 1 }}>
                            <input
                              type="text"
                              className="input-field"
                              value={editingItemName}
                              onChange={(e) => setEditingItemName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveItemEdit(item.id);
                                if (e.key === 'Escape') setEditingItemId(null);
                              }}
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem' }}
                              autoFocus
                            />
                            <button onClick={() => handleSaveItemEdit(item.id)} className="btn btn-primary" style={{ padding: '0.2rem 0.5rem' }}>✓</button>
                            <button onClick={() => setEditingItemId(null)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }}>✕</button>
                          </div>
                        ) : (
                          <div>
                            <span style={{ textDecoration: item.isPurchased ? 'line-through' : 'none', fontWeight: item.isPurchased ? 'normal' : '500' }}>
                              {item.name}
                            </span>
                            {item.history && item.history.length > 0 && (
                              <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '2px' }}>
                                {item.history.map((h: any, idx: number) => {
                                  const dateStr = new Date(h.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                                  const actionText = h.action === 'CREATED' ? 'Añadido' : h.action === 'PURCHASED' ? 'Comprado' : 'Desmarcado';
                                  return (
                                    <span key={h.id}>
                                      {actionText} por @{h.user?.username || '?'} ({dateStr})
                                      {idx < item.history.length - 1 ? ' • ' : ''}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {!isEditingThisItem && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => { setEditingItemId(item.id); setEditingItemName(item.name); }}
                            disabled={isItemProcessing}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}
                            title="Editar producto"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={isItemProcessing}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.7 }}
                            title="Borrar producto"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                No hay productos en esta lista. ¡Añade uno arriba!
              </div>
            )}
          </div>
        )}
      </div>

      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}
