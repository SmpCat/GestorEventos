'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addShoppingItem, togglePurchased, assignItem, deleteItem } from '@/actions/shopping';

export default function ShoppingList({ items, eventId, users, currentUser }: { items: any[], eventId: string, users: any[], currentUser: any }) {
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState<string | null>(null); // Guardar ID de la acción en curso

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

  const renderItem = (item: any) => {
    const isProcessing = loading === `toggle-${item.id}` || loading === `delete-${item.id}` || loading === `assign-${item.id}`;
    
    return (
      <div 
        key={item.id} 
        className="glass-panel flex flex-col md:flex-row justify-between items-start md:items-center p-4 mb-3 transition-opacity"
        style={{ opacity: isProcessing ? 0.5 : 1, padding: '1rem' }}
      >
        {/* Lado Izquierdo: Checkbox y Nombre */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input 
            type="checkbox" 
            checked={item.isPurchased}
            onChange={() => handleToggle(item.id, item.isPurchased)}
            disabled={isProcessing}
            style={{ width: '1.5rem', height: '1.5rem', accentColor: 'var(--accent-success)' }}
          />
          <span style={{ 
            fontSize: '1.2rem', 
            textDecoration: item.isPurchased ? 'line-through' : 'none',
            color: item.isPurchased ? 'var(--text-secondary)' : 'inherit'
          }}>
            {item.name}
          </span>
        </div>

        {/* Lado Derecho: Asignación y Borrar */}
        <div className="flex items-center gap-3 mt-3 md:mt-0 w-full md:w-auto justify-end">
          {!item.isPurchased && (
            <select 
              className="input-field" 
              style={{ padding: '0.4rem', fontSize: '0.85rem', width: 'auto', background: 'rgba(255,255,255,0.05)' }}
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
          )}

          <button 
            onClick={() => handleDelete(item.id)} 
            disabled={isProcessing}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.6 }}
            title="Borrar"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.2rem' }}>Lista de la Compra</h1>
          <p className="text-secondary">Planifica qué falta por comprar para el evento activo.</p>
        </div>
        <Link href="/" className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Barra para añadir manualmente */}
      <div className="glass-panel mb-8 p-6" style={{ borderColor: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input 
            type="text" 
            className="input-field flex-1" 
            placeholder="Ej. 10 botellas de Coca-Cola..."
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            disabled={loading === 'add'}
            style={{ fontSize: '1.1rem', padding: '1rem' }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading === 'add' || !newItemName.trim()} style={{ padding: '0 2rem', fontSize: '1.5rem' }}>
            +
          </button>
        </form>
        
        {/* Hueco preparado para la Inteligencia Artificial */}
        <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>¿Tienes una lista muy larga escrita a mano?</p>
          <button className="btn btn-secondary w-full" disabled style={{ opacity: 0.5 }}>
            📷 Escanear Lista Escrita con IA (Próximamente)
          </button>
        </div>
      </div>

      {/* Lista de Pendientes */}
      <h3 style={{ color: 'var(--accent-warning)', marginBottom: '1rem' }}>🛒 Pendiente de Comprar ({pendingItems.length})</h3>
      {pendingItems.length === 0 ? (
        <p className="text-secondary mb-8">No hay nada pendiente.</p>
      ) : (
        <div className="mb-8">
          {pendingItems.map(renderItem)}
        </div>
      )}

      {/* Lista de Comprados */}
      {purchasedItems.length > 0 && (
        <>
          <h3 style={{ color: 'var(--accent-success)', marginBottom: '1rem' }}>✅ Ya Comprado ({purchasedItems.length})</h3>
          <div style={{ opacity: 0.7 }}>
            {purchasedItems.map(renderItem)}
          </div>
        </>
      )}

    </div>
  );
}
