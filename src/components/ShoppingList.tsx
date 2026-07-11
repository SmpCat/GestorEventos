'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addShoppingItem, togglePurchased, assignItem, deleteItem, scanShoppingListAI, deleteShoppingListEvidence } from '@/actions/shopping';
import TrashIcon from './TrashIcon';

export default function ShoppingList({ items, evidences, eventId, users, currentUser }: { items: any[], evidences?: any[], eventId: string, users: any[], currentUser: any }) {
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'purchased'>('pending');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pendingItems = items.filter(item => !item.isPurchased);
  const purchasedItems = items.filter(item => item.isPurchased);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setLoading('add');
    await addShoppingItem(eventId, newItemName);
    setNewItemName('');
    setLoading(null);
  };

  const handleToggle = async (itemId: string, currentStatus: boolean) => {
    setLoading(`toggle-${itemId}`);
    await togglePurchased(itemId, !currentStatus);
    setLoading(null);
  };

  const handleAssign = async (itemId: string, userId: string) => {
    setLoading(`assign-${itemId}`);
    await assignItem(itemId, userId === 'UNASSIGN' ? null : userId);
    setLoading(null);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('¿Seguro que quieres borrar esto de la lista?')) {
      setLoading(`delete-${itemId}`);
      await deleteItem(itemId);
      setLoading(null);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (window.confirm('¿Seguro que quieres borrar esta foto? Se eliminará definitivamente.')) {
      setLoading(`delete-ev-${evidenceId}`);
      await deleteShoppingListEvidence(evidenceId);
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
        className="flex flex-col bg-black/20 p-3 rounded-lg transition-opacity gap-2"
        style={{ opacity: isProcessing ? 0.5 : 1, border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Primera fila: Checkbox, Nombre, Papelera */}
        <div className="flex justify-between items-start w-full gap-3">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={item.isPurchased}
              onChange={() => handleToggle(item.id, item.isPurchased)}
              disabled={isProcessing}
              className="shrink-0"
              style={{ width: '1.5rem', height: '1.5rem', accentColor: 'var(--accent-success)' }}
            />
            <span style={{ 
              fontSize: '1.05rem', 
              fontWeight: '600',
              textDecoration: item.isPurchased ? 'line-through' : 'none',
              color: item.isPurchased ? 'var(--accent-success)' : 'var(--text-primary)'
            }}>
              {item.name}
            </span>
          </div>

          {!item.isPurchased && (
            <button 
              onClick={() => handleDelete(item.id)} 
              disabled={isProcessing}
              className="text-red-400/70 hover:text-red-400 transition-colors bg-transparent border-none outline-none p-1 flex items-center justify-center shrink-0 ml-2"
              title="Borrar producto"
            >
              {isProcessing ? '⏳' : <TrashIcon />}
            </button>
          )}
        </div>

        {/* Segunda fila: Selector de asignación */}
        {!item.isPurchased && (
          <div style={{ paddingLeft: '2.25rem' }} className="w-full">
            <select 
              className="input-field w-full" 
              style={{ padding: '0.4rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)' }}
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
    <div className="max-w-3xl mx-auto py-6">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1>Lista de la Compra</h1>
          <p className="subtitle">Planifica qué falta por comprar para el evento activo.</p>
        </div>
      </div>



      {/* Controles para Añadir Elementos (Arriba) */}
      <h3 className="text-white font-bold text-lg" style={{ marginBottom: '1rem' }}>🛒 Añadir a la lista</h3>
      <div className="glass-panel mb-16 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <form onSubmit={handleAdd} className="flex gap-3 w-full">
            <input 
              type="text" 
              className="input-field flex-1" 
              placeholder="Escribe un producto..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              disabled={loading === 'add'}
              style={{ fontSize: '1.1rem', padding: '1rem', fontWeight: '500' }}
            />
            <button type="submit" className="btn btn-primary flex items-center justify-center" disabled={loading === 'add' || !newItemName.trim()} style={{ width: '3.5rem', padding: '0', fontSize: '1.4rem' }}>
              +
            </button>
          </form>
          
          <div className="flex items-center justify-center gap-4">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>o alternativamente...</span>
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
            className="w-full btn btn-primary py-3 text-lg font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            onClick={() => document.getElementById('ai-scanner-input')?.click()}
            disabled={loading === 'scanning'}
            style={{ opacity: loading === 'scanning' ? 0.7 : 1 }}
          >
            {loading === 'scanning' ? (
              '⏳ Procesando con IA...'
            ) : (
              <>
                <span className="text-2xl">📸</span> Subir o hacer foto a una lista
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pestañas (Tabs) estilo Segmented Control */}
      <h3 className="text-white font-bold text-lg" style={{ marginTop: '3rem', marginBottom: '1rem' }}>📋 Lista</h3>
      <div className="flex p-1 bg-black/40 rounded-xl mb-6" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`transition-all font-bold ${activeTab === 'pending' ? 'shadow-md' : 'hover:opacity-80'}`}
          style={{ 
            flex: 1,
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '1.17rem',
            background: activeTab === 'pending' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: activeTab === 'pending' ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
            color: activeTab === 'pending' ? '#cbd5e1' : 'var(--text-secondary)'
          }}
        >
          🛒 Pendientes ({pendingItems.length})
        </button>
        <button 
          onClick={() => setActiveTab('purchased')}
          className={`transition-all font-bold ${activeTab === 'purchased' ? 'shadow-md' : 'hover:opacity-80'}`}
          style={{ 
            flex: 1,
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '1.17rem',
            background: activeTab === 'purchased' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: activeTab === 'purchased' ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
            color: activeTab === 'purchased' ? 'var(--accent-success)' : 'var(--text-secondary)'
          }}
        >
          ✅ Comprados ({purchasedItems.length})
        </button>
      </div>

      {/* Lista Activa */}
      <div className="glass-panel mb-8 p-4 md:p-6" style={{ opacity: activeTab === 'purchased' ? 0.8 : 1 }}>
        <div className="flex flex-col gap-2">
          {activeTab === 'pending' ? (
            pendingItems.length === 0 ? (
              <p className="text-secondary italic">No hay nada pendiente.</p>
            ) : (
              pendingItems.map(renderItem)
            )
          ) : (
            purchasedItems.length === 0 ? (
              <p className="text-secondary italic">Aún no se ha comprado nada.</p>
            ) : (
              purchasedItems.map(renderItem)
            )
          )}
        </div>
      </div>



      {/* Galería de Evidencias */}
      {evidences && evidences.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h3 className="text-white font-bold text-lg" style={{ marginBottom: '1rem' }}>📷 Listas Originales</h3>
          <div className="glass-panel mb-10 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {evidences.map((ev: any) => {
                const apiImageUrl = `/api${ev.url}`; // /api/uploads/shopping-lists/filename.jpg
                const dateStr = new Date(ev.createdAt).toLocaleString('es-ES', {
                  day: '2-digit', month: '2-digit', year: '2-digit',
                  hour: '2-digit', minute: '2-digit'
                });
                return (
                  <div key={ev.id} className="flex flex-col gap-2 relative">
                      <div className="flex justify-between items-center px-1 mb-1">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          🗓️ {dateStr}
                        </span>
                        <button
                          onClick={() => handleDeleteEvidence(ev.id)}
                          disabled={loading === `delete-ev-${ev.id}`}
                          className="text-red-400/70 hover:text-red-400 transition-colors bg-transparent border-none outline-none p-1 flex items-center justify-center shrink-0"
                          title="Borrar foto"
                        >
                          {loading === `delete-ev-${ev.id}` ? '⏳' : <TrashIcon />}
                        </button>
                      </div>
                      <a 
                        href={apiImageUrl}
                        className="block border border-white/10 rounded overflow-hidden" 
                        style={{ minHeight: '100px', opacity: loading === `delete-ev-${ev.id}` ? 0.5 : 1 }}
                      >
                        <img src={apiImageUrl} alt="Ticket" className="w-full h-auto object-cover" style={{ aspectRatio: '1/1' }} />
                      </a>
                    </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
