'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addShoppingItem, togglePurchased, togglePurchasedBulk, assignItem, deleteItem, scanShoppingListAI, deleteShoppingListEvidence } from '@/actions/shopping';
import TrashIcon from './TrashIcon';
import AiLoadingOverlay from './AiLoadingOverlay';
import ImageLightbox from './ImageLightbox';
import styles from './ShoppingList.module.css';

export default function ShoppingList({ items, evidences, eventId, users, currentUser }: { items: any[], evidences?: any[], eventId: string, users: any[], currentUser: any }) {
  const router = useRouter();
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'purchased'>('pending');

  const pendingItems = items.filter(item => !item.isPurchased);
  const purchasedItems = items.filter(item => item.isPurchased);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setLoading('add');
    await addShoppingItem(eventId, newItemName, currentUser.id);
    router.refresh();
    setNewItemName('');
    setLoading(null);
  };

  const handleToggle = async (itemId: string, currentStatus: boolean) => {
    const msg = currentStatus 
      ? '¿Devolver este artículo a la lista de pendientes?' 
      : '¿Marcar este artículo como comprado?';
      
    if (window.confirm(msg)) {
      setLoading(`toggle-${itemId}`);
      await togglePurchased(itemId, !currentStatus, currentUser.id);
      router.refresh();
      setLoading(null);
    }
  };

  const handleToggleBulk = async (itemIds: string[], targetStatus: boolean) => {
    const msg = targetStatus
      ? '¿Marcar todos estos artículos como comprados?'
      : '¿Devolver todos estos artículos a la lista de pendientes?';

    if (window.confirm(msg)) {
      setLoading('toggle-bulk');
      await togglePurchasedBulk(itemIds, targetStatus, currentUser.id);
      router.refresh();
      setLoading(null);
    }
  };

  const handleAssign = async (itemId: string, userId: string) => {
    setLoading(`assign-${itemId}`);
    await assignItem(itemId, userId === 'UNASSIGN' ? null : userId);
    router.refresh();
    setLoading(null);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('¿Seguro que quieres borrar esto de la lista?')) {
      setLoading(`delete-${itemId}`);
      deleteItem(itemId).then(() => {
        router.refresh();
        setLoading(null);
      });
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (window.confirm('¿Seguro que quieres borrar esta foto? Se eliminará definitivamente.')) {
      setLoading(`delete-ev-${evidenceId}`);
      await deleteShoppingListEvidence(evidenceId);
      router.refresh();
      setLoading(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading('scanning');

    // Función auxiliar para redimensionar la imagen en el cliente y evitar que pese megas
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
            
            // Exportamos como JPEG al 70% de calidad para ahorrar muchísimo peso
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl.split(',')[1]); 
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });
    };

    try {
      const base64String = await compressImage(file);
      
      const res = await scanShoppingListAI(eventId, base64String, 'image/jpeg');
      
      if (res.success) {
        alert(`¡Magia! La IA ha encontrado y añadido ${res.count} artículos a tu lista.`);
      } else {
        alert(`Ups, hubo un problema con la IA: ${res.error}`);
      }
    } catch (err: any) {
      alert('Error de conexión o imagen demasiado grande: ' + err.message);
    } finally {
      setLoading(null);
      if (e.target) e.target.value = '';
    }
  };

  const renderItem = (item: any) => {
    const isProcessing = loading === `toggle-${item.id}` || loading === `delete-${item.id}` || loading === `assign-${item.id}`;
    
    return (
      <div 
        key={item.id} 
        className={styles.itemRow}
        style={{ opacity: isProcessing ? 0.5 : 1 }}
      >
        <div className={styles.itemHeader}>
          <div className={styles.itemLeft}>
            <input 
              type="checkbox" 
              checked={false}
              onChange={() => handleToggle(item.id, item.isPurchased)}
              disabled={isProcessing}
              className={styles.checkbox}
              title={item.isPurchased ? "Devolver a pendientes" : "Marcar como comprado"}
            />
              <div className={styles.itemNameWrapper}>
                <span className={styles.itemName} style={{ textDecoration: item.isPurchased ? 'line-through' : 'none' }}>
                  {item.name}
                </span>
                {item.history && item.history.length > 0 && (
                  <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '2px', lineHeight: '1.2' }}>
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
            </div>

          {!item.isPurchased && (
            <button 
              onClick={() => handleDelete(item.id)} 
              disabled={isProcessing}
              className={styles.deleteBtn}
              title="Borrar producto"
            >
              {isProcessing ? '⏳' : <TrashIcon />}
            </button>
          )}
        </div>

        {!item.isPurchased && (
          <div className={styles.assignSelectWrapper}>
            <select 
              className={`input-field ${styles.assignSelect}`}
              value={item.assigneeId || 'UNASSIGN'}
              onChange={(e) => handleAssign(item.id, e.target.value)}
              disabled={isProcessing}
            >
              <option value="UNASSIGN">Libre (Cualquiera)</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.id === currentUser.id ? '🙋‍♂️ ¡Yo lo compro!' : `Asignar a: ${u.name}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <AiLoadingOverlay isVisible={loading === 'scanning'} message="Vinculando productos del ticket con la lista..." />
      
      <div className={styles.headerRow}>
        <div>
          <h1>Lista de la Compra</h1>
          <p className="subtitle">Planifica qué falta por comprar para el evento activo.</p>
        </div>
      </div>

      <h3 className={`${styles.sectionTitle} ${styles.sectionTitleFirst}`}>🛒 Añadir a la lista</h3>
      <div className="glass-panel">
        <div className={styles.innerBlackBox}>
          <div className={styles.addFormWrapper}>
            <form onSubmit={handleAdd} className={styles.addForm}>
              <input 
                type="text" 
                className={`input-field ${styles.addInput}`} 
                placeholder="Escribe un producto..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                disabled={loading === 'add'}
              />
              <button type="submit" className={`btn ${styles.addBtn}`} disabled={loading === 'add' || !newItemName.trim()}>
                +
              </button>
            </form>
            
            <div className={styles.orDivider}>
              <span className={styles.orText}>o alternativamente...</span>
            </div>

            <input 
              type="file" 
              accept="image/*" 
              id="ai-scanner-input" 
              className="hidden" 
              onChange={handleImageUpload} 
              disabled={loading === 'scanning'}
              style={{ display: 'none' }}
            />
            <button 
              type="button"
              className={`btn ${styles.uploadBtn}`}
              onClick={() => document.getElementById('ai-scanner-input')?.click()}
              disabled={loading === 'scanning'}
              style={{ opacity: loading === 'scanning' ? 0.7 : 1 }}
            >
              {loading === 'scanning' ? (
                '⏳ Procesando con IA...'
              ) : (
                <>
                  <span style={{ fontSize: '1.5rem' }}>📸</span> Subir o hacer foto a una lista
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>📋 Lista</h3>
      <div className={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`${styles.tabBtn} ${activeTab === 'pending' ? styles.tabBtnPending : `${styles.tabBtnPendingInactive} ${styles.tabBtnInactiveHover}`}`}
        >
          🛒 Pendientes ({pendingItems.length})
        </button>
        <button 
          onClick={() => setActiveTab('purchased')}
          className={`${styles.tabBtn} ${activeTab === 'purchased' ? styles.tabBtnPurchased : `${styles.tabBtnPurchasedInactive} ${styles.tabBtnInactiveHover}`}`}
        >
          ✅ Comprados ({purchasedItems.length})
        </button>
      </div>

      <div className="glass-panel" style={{ opacity: activeTab === 'purchased' ? 0.8 : 1 }}>
        <div className={styles.innerBlackBox}>
          
          {(activeTab === 'pending' && pendingItems.length > 0) && (
            <div className={styles.bulkActionRow} style={{ opacity: loading === 'toggle-bulk' ? 0.5 : 1 }}>
              <input 
                type="checkbox"
                className={styles.checkbox}
                checked={false}
                disabled={loading === 'toggle-bulk'}
                onChange={(e) => {
                  handleToggleBulk(pendingItems.map(i => i.id), true);
                  e.target.checked = false;
                }}
              />
              <span className={styles.bulkActionText}>Marcar todos como comprados</span>
            </div>
          )}

          {(activeTab === 'purchased' && purchasedItems.length > 0) && (
            <div className={styles.bulkActionRow} style={{ opacity: loading === 'toggle-bulk' ? 0.5 : 1 }}>
              <input 
                type="checkbox"
                className={styles.checkbox}
                checked={false}
                disabled={loading === 'toggle-bulk'}
                onChange={(e) => {
                  handleToggleBulk(purchasedItems.map(i => i.id), false);
                  e.target.checked = false;
                }}
              />
              <span className={styles.bulkActionText}>Devolver todos a pendientes</span>
            </div>
          )}

          <div className={styles.itemsContainer}>
            {activeTab === 'pending' ? (
              pendingItems.length === 0 ? (
                <p className={styles.emptyState}>No hay nada pendiente.</p>
              ) : (
                pendingItems.map(renderItem)
              )
            ) : (
              purchasedItems.length === 0 ? (
                <p className={styles.emptyState}>Aún no se ha comprado nada.</p>
              ) : (
                purchasedItems.map(renderItem)
              )
            )}
          </div>
        </div>
      </div>

      {evidences && evidences.length > 0 && (
        <div>
          <h3 className={styles.sectionTitle}>📷 Listas Originales</h3>
          <div className="glass-panel">
            <div className={styles.innerBlackBox}>
              <div className={styles.galleryGrid}>
                {evidences.map((ev: any) => {
                  const apiImageUrl = `/api${ev.url}`;
                  const dateStr = new Date(ev.createdAt).toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  });
                  return (
                    <div key={ev.id} className={styles.galleryItem}>
                        <div className={styles.galleryHeader}>
                          <span className={styles.galleryDate}>
                            🗓️ {dateStr}
                          </span>
                          <button
                            onClick={() => handleDeleteEvidence(ev.id)}
                            disabled={loading === `delete-ev-${ev.id}`}
                            className={styles.galleryDeleteBtn}
                            title="Borrar foto"
                          >
                            {loading === `delete-ev-${ev.id}` ? '⏳' : <TrashIcon />}
                          </button>
                        </div>
                        <div 
                          onClick={() => setLightboxImage(apiImageUrl)}
                          className={styles.galleryLink}
                          style={{ opacity: loading === `delete-ev-${ev.id}` ? 0.5 : 1, cursor: 'pointer' }}
                        >
                          <img src={apiImageUrl} alt="Ticket" className={styles.galleryImg} />
                        </div>
                      </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
