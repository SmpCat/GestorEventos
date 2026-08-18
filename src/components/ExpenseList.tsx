'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteExpenseAction, processReceiptAction, saveExpenseAction, saveManualExpenseAction, deleteExpenseEvidence, ReceiptData, reScanExpenseAI, moveExpenseToGroup, renameExpenseGroup, deleteExpenseGroup, updateExpenseDescription, updateExpenseDetails, mergeExpenseGroups } from '@/actions/receipts';
import TrashIcon from './TrashIcon';
import styles from './ExpenseList.module.css';
import AiLoadingOverlay from './AiLoadingOverlay';
import ImageLightbox from './ImageLightbox';

export default function ExpenseList({ 
  expenses, 
  groups = [],
  shoppingListNames = [],
  attendees = [],
  isAdmin, 
  isSuperAdmin,
  currentUserId,
  canUploadTickets = true
}: { 
  expenses: any[]; 
  groups?: any[];
  shoppingListNames?: string[];
  attendees?: any[];
  isAdmin: boolean; 
  isSuperAdmin?: boolean;
  currentUserId: string;
  canUploadTickets?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxExpense, setLightboxExpense] = useState<{ id: string; isScanned: boolean } | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal de edición de ticket
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [editModalStore, setEditModalStore] = useState('');
  const [editModalAmount, setEditModalAmount] = useState('');
  const [editModalDate, setEditModalDate] = useState('');
  const [editModalDesc, setEditModalDesc] = useState('');
  const [editModalContributor, setEditModalContributor] = useState('');
  const [editModalContributorSearch, setEditModalContributorSearch] = useState('');
  const [editModalGroup, setEditModalGroup] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (expense: any) => {
    setEditingTicket(expense);
    setEditModalStore(expense.store || '');
    setEditModalAmount(expense.amount?.toString() || '');
    setEditModalDate(expense.date ? new Date(expense.date).toISOString().split('T')[0] : '');
    setEditModalDesc(expense.description || '...');
    setEditModalContributor(expense.contributorAttendeeId || '');
    setEditModalContributorSearch('');
    setEditModalGroup(expense.groupId || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTicket) return;
    setIsSavingEdit(true);
    const res = await updateExpenseDetails(editingTicket.id, {
      store: editModalStore,
      amount: parseFloat(editModalAmount) || 0,
      date: editModalDate,
      description: editModalDesc,
      contributorAttendeeId: editModalContributor || null,
      groupId: editModalGroup || null,
    });
    setIsSavingEdit(false);
    if (!res.success) alert(`Error: ${res.error}`);
    else { setEditingTicket(null); router.refresh(); }
  };

  // Estados para entrada manual
  const [manualStore, setManualStore] = useState('');
  const [manualAmount, setManualAmount] = useState<number | ''>('');
  const [isManualLoading, setIsManualLoading] = useState(false);

  // Estado para categoría seleccionada (vacío = "General" por defecto al guardar)
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [manualGroupName, setManualGroupName] = useState('');
  const [manualGroupIsNew, setManualGroupIsNew] = useState(false);
  const [manualGroupNewName, setManualGroupNewName] = useState('');
  const [selectedGroupIsNew, setSelectedGroupIsNew] = useState(false);
  const [selectedGroupNewName, setSelectedGroupNewName] = useState('');
  // Contribuidor (pagado de su bolsillo) + buscador
  const [selectedContributor, setSelectedContributor] = useState('');
  const [selectedContributorSearch, setSelectedContributorSearch] = useState('');
  const [manualContributor, setManualContributor] = useState('');
  const [manualContributorSearch, setManualContributorSearch] = useState('');

  const filteredAttendeesForPhoto = attendees.filter((a: any) =>
    !selectedContributorSearch ||
    (a.user?.name || '').toLowerCase().includes(selectedContributorSearch.toLowerCase()) ||
    (a.user?.username || '').toLowerCase().includes(selectedContributorSearch.toLowerCase())
  );
  const filteredAttendeesForManual = attendees.filter((a: any) =>
    !manualContributorSearch ||
    (a.user?.name || '').toLowerCase().includes(manualContributorSearch.toLowerCase()) ||
    (a.user?.username || '').toLowerCase().includes(manualContributorSearch.toLowerCase())
  );

  // Descripción al subir tickets (default: '...')
  const [ticketDescription, setTicketDescription] = useState('...');
  const [manualDescription, setManualDescription] = useState('...');

  // Estado para edición inline de nombre de grupo
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  const handleRenameGroup = async (groupId: string) => {
    if (!editingGroupName.trim()) { setEditingGroupId(null); return; }
    const res = await renameExpenseGroup(groupId, editingGroupName);
    if (!res.success) {
      if ((res as any).conflict) {
        // Ya existe una categoría con ese nombre—preguntar si fusionar
        const targetName = (res as any).targetName;
        const targetGroupId = (res as any).targetGroupId;
        const confirm = window.confirm(
          `Ya existe la categoría "${targetName}". ¿Quieres fusionar todos los tickets de esta categoría en "${targetName}"?\n\nEsta acción no se puede deshacer.`
        );
        if (confirm) {
          const mergeRes = await mergeExpenseGroups(groupId, targetGroupId);
          if (!mergeRes.success) alert(`Error al fusionar: ${mergeRes.error}`);
          else router.refresh();
        }
      } else {
        alert(`Error: ${res.error}`);
      }
    } else {
      router.refresh();
    }
    setEditingGroupId(null);
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`¿Borrar la categoría "${groupName}" y TODOS sus tickets? Esta acción no se puede deshacer.`)) return;
    const res = await deleteExpenseGroup(groupId);
    if (!res.success) alert(`Error: ${res.error}`);
    else router.refresh();
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm('¿Seguro que quieres borrar este ticket?')) {
      setLoading(expenseId);
      await deleteExpenseAction(expenseId);
      setLoading(null);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (window.confirm('¿Seguro que quieres borrar esta foto de evidencia?')) {
      setLoading(`delete-ev-${evidenceId}`);
      await deleteExpenseEvidence(evidenceId);
      setLoading(null);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStore.trim() || manualAmount === '' || Number(manualAmount) <= 0) return;
    
    setIsManualLoading(true);
    setError(null);
    const dateStr = new Date().toISOString().split('T')[0];
    
    const res = await saveManualExpenseAction({
      store: manualStore,
      amount: Number(manualAmount),
      description: manualDescription.trim() || '...',
      date: dateStr,
      groupName: (manualGroupIsNew ? manualGroupNewName : manualGroupName) || 'General',
      contributorAttendeeId: manualContributor || undefined,
    });
    
    if (!res.success) {
      setError(res.error || 'Error al guardar el ticket.');
    } else {
      setManualStore('');
      setManualAmount('');
      setManualDescription('...');
      setManualContributor('');
      setManualContributorSearch('');
      setManualGroupIsNew(false);
      setManualGroupNewName('');
    }
    setIsManualLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("groupName", (selectedGroupIsNew ? selectedGroupNewName : selectedGroupName) || 'General');
    formData.append("description", ticketDescription.trim() || '...');
    if (selectedContributor) formData.append("contributorAttendeeId", selectedContributor);

    try {
      const res = await processReceiptAction(formData);
      if (res.success) {
        if (res.isScanned && res.data) {
          // Auto-guardar directamente sin confirmación
          const saveRes = await saveExpenseAction(res.data);
          if (!saveRes.success) {
            setError(saveRes.error || 'Error al guardar el ticket.');
          } else {
            router.refresh();
          }
        } else {
          // IA falló pero se guardó la imagen
          router.refresh();
        }
      } else {
        setError(res.error || "Error al leer el ticket.");
      }
    } catch (err: any) {
      setError(err.message || "Error de red.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReScan = async (expenseId: string) => {
    setLoading(`rescan-exp-${expenseId}`);
    const timeout = setTimeout(() => {
      setLoading(null);
      alert('⏱️ El escaneo tardó demasiado. Inténtalo de nuevo en unos segundos.');
    }, 45000);
    try {
      const res = await reScanExpenseAI(expenseId);
      clearTimeout(timeout);
      if (res.success) {
        alert("¡Éxito! El ticket ha sido escaneado correctamente y el gasto ha sido actualizado.");
        router.refresh();
      } else {
        alert(`No se pudo escanear: ${res.error}`);
      }
    } catch (err: any) {
      clearTimeout(timeout);
      alert(`Error al procesar: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.container}>
      <AiLoadingOverlay 
        isVisible={isUploading || (typeof loading === 'string' && loading.startsWith('rescan-exp-'))} 
        title="Analizando Ticket"
        message={typeof loading === 'string' && loading.startsWith('rescan-exp-') ? "Re-escaneando ticket con IA..." : "Extrayendo comercio, importe y fecha con IA..."}
        onCancel={typeof loading === 'string' && loading.startsWith('rescan-exp-') ? () => setLoading(null) : undefined}
      />
      
      <div className={styles.headerRow}>
        <div>
          <h1>Tickets de Compra</h1>
          <p className="subtitle">Gestiona y revisa los tickets escaneados del evento activo.</p>
        </div>
      </div>

      <h3 className={styles.sectionTitle} style={{ marginBottom: '0.75rem' }}>🧾 Añadir Ticket</h3>

      <div className="glass-panel" style={{ marginBottom: '4rem' }}>
        <div className={styles.innerBlackBox}>
          {!canUploadTickets ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#fca5a5' }}>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                🚫 Subida de Tickets Deshabilitada
              </p>
              <p style={{ fontSize: '0.875rem', opacity: 0.85, color: 'var(--text-secondary)' }}>
                Tu usuario tiene deshabilitada la entrada de tickets (tanto manual como fotográfica) por la administración.
              </p>
            </div>
          ) : (
            <div className={styles.uploadWrapper}>
              
              {/* Formulario de Entrada Manual */}
              <div className={styles.inputRow}>
                <span className={styles.rowLabel}>Manualmente</span>
                <form onSubmit={handleManualAdd} className={styles.addForm}>
                  <input 
                    type="text" 
                    className={`input-field ${styles.addInput}`} 
                    placeholder="Establecimiento o concepto..."
                    value={manualStore}
                    onChange={e => setManualStore(e.target.value)}
                    disabled={isManualLoading || isUploading}
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    className={`input-field ${styles.addInputAmount}`} 
                    placeholder="0.00 €"
                    value={manualAmount}
                    onChange={e => setManualAmount(e.target.value ? Number(e.target.value) : '')}
                    disabled={isManualLoading || isUploading}
                  />
                  <button type="submit" className={`btn ${styles.addBtn}`} disabled={isManualLoading || isUploading || !manualStore.trim() || manualAmount === ''}>
                    {isManualLoading ? '⏳' : '+ Añadir'}
                  </button>
                </form>
              </div>
              <div className={styles.inputRow} style={{ marginTop: '-0.5rem' }}>
                <span className={styles.rowLabel} style={{ fontSize: '0.8rem', opacity: 0.7 }}>Categoría</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <select
                    className={`input-field ${styles.addInput}`}
                    value={manualGroupIsNew ? '__new__' : manualGroupName}
                    onChange={e => { if (e.target.value === '__new__') { setManualGroupIsNew(true); setManualGroupName(''); } else { setManualGroupIsNew(false); setManualGroupName(e.target.value); } }}
                    disabled={isManualLoading || isUploading}
                    style={{ maxWidth: '280px' }}
                  >
                    <option value="">General (por defecto)</option>
                    {[...new Set([...groups.map((g: any) => g.name), ...shoppingListNames])].map((name: string) => <option key={name} value={name}>{name}</option>)}
                    <option value="__new__">+ Nueva categoría...</option>
                  </select>
                  {manualGroupIsNew && (
                    <input
                      type="text"
                      className={`input-field ${styles.addInput}`}
                      placeholder="Nombre de la nueva categoría"
                      value={manualGroupNewName}
                      onChange={e => setManualGroupNewName(e.target.value)}
                      disabled={isManualLoading || isUploading}
                      style={{ maxWidth: '280px' }}
                      autoFocus
                    />
                  )}
                </div>
              </div>
              <div className={styles.inputRow} style={{ marginTop: '-0.5rem' }}>
                <span className={styles.rowLabel} style={{ fontSize: '0.8rem', opacity: 0.7 }}>Pagado por</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                    <input
                      type="text"
                      className={`input-field ${styles.addInput}`}
                      placeholder="🔍 Filtrar asistentes..."
                      value={manualContributorSearch}
                      onChange={e => setManualContributorSearch(e.target.value)}
                      disabled={isManualLoading || isUploading}
                      style={{ width: '100%', fontSize: '0.85rem', paddingRight: '2rem' }}
                    />
                    {manualContributorSearch && (
                      <button onClick={() => setManualContributorSearch('')}
                        style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                        title="Limpiar búsqueda">✕</button>
                    )}
                  </div>
                  <select
                    className={`input-field ${styles.addInput}`}
                    value={manualContributor}
                    onChange={e => setManualContributor(e.target.value)}
                    disabled={isManualLoading || isUploading}
                    style={{ width: '100%', maxWidth: '280px' }}
                  >
                    <option value="">Ninguno (del bote)</option>
                    {filteredAttendeesForManual.map((att: any) => <option key={att.id} value={att.id}>{att.user?.name || att.user?.username}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.inputRow} style={{ marginTop: '-0.5rem' }}>
                <span className={styles.rowLabel} style={{ fontSize: '0.8rem', opacity: 0.7 }}>Descripción</span>
                <input
                  type="text"
                  className={`input-field ${styles.addInput}`}
                  placeholder="Ej: Ticket de Felipe (opcional)"
                  value={manualDescription}
                  onChange={e => setManualDescription(e.target.value)}
                  disabled={isManualLoading || isUploading}
                  style={{ maxWidth: '320px' }}
                />
              </div>

              <div className={styles.orDivider}>
                <span className={styles.orText}>o alternativamente...</span>
              </div>

              {/* Escáner de IA */}
              <div className={styles.inputRow}>
                <span className={styles.rowLabel}>Fotográficamente</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className={`btn ${styles.uploadBtn}`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isManualLoading}
                    style={{ opacity: isUploading ? 0.7 : 1 }}
                  >
                    {isUploading ? (
                      '⏳ Procesando con IA...'
                    ) : (
                      <>
                        <span style={{ fontSize: '1.5rem' }}>📸</span> Subir o hacer foto a un ticket
                      </>
                    )}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, whiteSpace: 'nowrap' }}>Categoría:</span>
                    <select
                      className="input-field"
                      value={selectedGroupIsNew ? '__new__' : selectedGroupName}
                      onChange={e => { if (e.target.value === '__new__') { setSelectedGroupIsNew(true); setSelectedGroupName(''); } else { setSelectedGroupIsNew(false); setSelectedGroupName(e.target.value); } }}
                      disabled={isUploading || isManualLoading}
                      style={{ maxWidth: '200px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                    >
                      <option value="">General (por defecto)</option>
                      {[...new Set([...groups.map((g: any) => g.name), ...shoppingListNames])].map((name: string) => <option key={name} value={name}>{name}</option>)}
                      <option value="__new__">+ Nueva categoría...</option>
                    </select>
                    {selectedGroupIsNew && (
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Nombre de la nueva categoría"
                        value={selectedGroupNewName}
                        onChange={e => setSelectedGroupNewName(e.target.value)}
                        disabled={isUploading || isManualLoading}
                        style={{ maxWidth: '200px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                        autoFocus
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, whiteSpace: 'nowrap' }}>Descripción:</span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ej: Ticket de Felipe (opcional)"
                      value={ticketDescription}
                      onChange={e => setTicketDescription(e.target.value)}
                      disabled={isUploading || isManualLoading}
                      style={{ maxWidth: '240px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Pagado por:</span>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="🔍 Filtrar asistentes..."
                        value={selectedContributorSearch}
                        onChange={e => setSelectedContributorSearch(e.target.value)}
                        disabled={isUploading || isManualLoading}
                        style={{ width: '100%', padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
                      />
                      {selectedContributorSearch && (
                        <button onClick={() => setSelectedContributorSearch('')}
                          style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                          title="Limpiar búsqueda">✕</button>
                      )}
                    </div>
                    <select
                      className="input-field"
                      value={selectedContributor}
                      onChange={e => setSelectedContributor(e.target.value)}
                      disabled={isUploading || isManualLoading}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    >
                      <option value="">Ninguno (del bote)</option>
                      {filteredAttendeesForPhoto.map((att: any) => <option key={att.id} value={att.id}>{att.user?.name || att.user?.username}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.uploadHelperText}>
                Sube una foto y la IA extraerá los datos automáticamente
              </div>

              {error && (
                <div className={styles.errorBox}>
                  ❌ {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Listado agrupado por categoría */}
      {(() => {
        const visibleExpenses = expenses;
        const totalAll = visibleExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

        // Agrupar por nombre de grupo
        const grouped: Record<string, any[]> = {};
        for (const exp of visibleExpenses) {
          const gName = exp.group?.name || 'Sin categoría';
          if (!grouped[gName]) grouped[gName] = [];
          grouped[gName].push(exp);
        }
        const groupNames = Object.keys(grouped);

        return (
          <>
            <div className={styles.listHeader}>
              <h3 className={styles.listHeaderTitle}>📊 Lista de Tickets</h3>
              <div className={styles.listHeaderTotal}>
                {totalAll.toFixed(2)}&nbsp;€
              </div>
            </div>

            {visibleExpenses.length === 0 ? (
              <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                <div className={styles.innerBlackBox}>
                  <p className={styles.emptyState}>Aún no se ha registrado ningún ticket.</p>
                </div>
              </div>
            ) : (
              groupNames.map(gName => {
                const groupExpenses = grouped[gName];
                const groupTotal = groupExpenses.reduce((s: number, e: any) => s + e.amount, 0);
                return (
                  <div key={gName} style={{ marginBottom: '2rem' }}>
                    {/* Cabecera de grupo */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.6rem 1rem', marginBottom: '0.5rem',
                      background: 'rgba(255,255,255,0.06)', borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        {editingGroupId === (grouped[gName][0]?.groupId || null) ? (
                          <input
                            autoFocus
                            value={editingGroupName}
                            onChange={e => setEditingGroupName(e.target.value)}
                            onBlur={() => handleRenameGroup(editingGroupId!)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameGroup(editingGroupId!);
                              if (e.key === 'Escape') setEditingGroupId(null);
                            }}
                            style={{
                              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(56,189,248,0.5)',
                              borderRadius: '6px', color: '#e2e8f0', padding: '0.2rem 0.5rem',
                              fontSize: '0.95rem', fontWeight: 700, width: '200px'
                            }}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                            📦 {gName} <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.85rem' }}>({groupExpenses.length} ticket{groupExpenses.length !== 1 ? 's' : ''})</span>
                          </span>
                        )}
                        {isAdmin && editingGroupId !== (grouped[gName][0]?.groupId || null) && (
                          <button
                            onClick={() => {
                              const grp = groups.find((g: any) => g.name === gName);
                              if (grp) { setEditingGroupId(grp.id); setEditingGroupName(grp.name); }
                            }}
                            title="Renombrar categoría"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.85, padding: '0 0.25rem' }}
                          >✏️</button>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '1rem' }}>
                        {groupTotal.toFixed(2)}&nbsp;€
                      </span>
                      {isAdmin && (() => { const grp = groups.find((g: any) => g.name === gName); return grp ? (
                        <button
                          onClick={() => handleDeleteGroup(grp.id, grp.name)}
                          title="Borrar categoría y todos sus tickets"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.85, color: '#fff', padding: '0 0.25rem', marginLeft: '0.25rem' }}
                        >🗑️</button>
                      ) : null; })()}
                    </div>

                    <div className="glass-panel">
                      <div className={styles.innerBlackBox}>
                        <div className={styles.expensesList}>
                          {groupExpenses.map((expense: any) => {
                            const canDelete = isAdmin || expense.purchaserId === currentUserId;
                            const dateStr = new Date(expense.date).toLocaleString('es-ES', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            });
                            return (
                              <div key={expense.id} className={styles.expenseCard}>
                                <div className={styles.expenseTopRow}>
                                  <div className={styles.expenseMeta}>
                                    <div className={styles.expenseMetaInfo}>
                                      <div className={styles.expenseDateUser}>
                                        {dateStr}
                                        {!expense.isScanned && (
                                          <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fef08a', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                            ⚠️ No digitalizado
                                          </span>
                                        )}
                                      </div>
                                      {expense.store !== 'Desconocido' && expense.store !== 'Gasto general' && expense.store !== 'Comercio desconocido' && (
                                        <div className={styles.expenseStore}>{expense.store}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                     {expense.images.length > 0 && (
                                       <button
                                         onClick={() => {
                                           setLightboxImage(`/api${expense.images[0].url}`);
                                           setLightboxExpense({ id: expense.id, isScanned: expense.isScanned });
                                         }}
                                         title="Ver foto del ticket"
                                         style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.85, padding: '0' }}
                                       >📷</button>
                                     )}
                                     {!expense.isScanned && expense.images.length > 0 && (
                                       <button onClick={() => handleReScan(expense.id)} disabled={loading === `rescan-exp-${expense.id}`}
                                         className={styles.expenseReScanBtn} title="Re-escanear con IA"
                                         style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '0.95rem' }}>
                                         {loading === `rescan-exp-${expense.id}` ? '⏳' : '🔄'}
                                       </button>
                                     )}
                                     <button
                                       onClick={() => openEditModal(expense)}
                                       title="Editar ticket"
                                       style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.85, padding: '0' }}
                                     >✏️</button>
                                     {canDelete && (
                                       <button onClick={() => handleDelete(expense.id)} disabled={loading === expense.id}
                                         className={styles.expenseDeleteBtn} title="Eliminar ticket">
                                         {loading === expense.id ? '⏳' : <TrashIcon />}
                                       </button>
                                     )}
                                   </div>
                                </div>
                                {/* Descripción + contribuidor */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                                  <span className={styles.expenseDescription} style={{ flex: 1, opacity: expense.description === '...' ? 0.4 : 1 }}>
                                    {expense.description || '...'}
                                  </span>
                                  {expense.contributorAttendee && (
                                    <span style={{ fontSize: '0.72rem', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', borderRadius: '999px', padding: '0.1rem 0.5rem', whiteSpace: 'nowrap' }}>
                                      💸 {expense.contributorAttendee.user?.name || expense.contributorAttendee.user?.username}
                                    </span>
                                  )}
                                </div>
                                <div className={styles.expenseItemsContainer}>
                                  <div className={styles.expenseItemsList}>
                                    {expense.items.map((item: any, idx: number) => (
                                      <div key={idx} className={styles.expenseItemRow}>
                                        <span>{item.quantity}x {item.name}</span>
                                        {item.price > 0 && <span className={styles.expenseItemPrice}>{item.price.toFixed(2)}&nbsp;€</span>}
                                      </div>
                                    ))}
                                  </div>
                                  <div className={styles.expenseTotalRow}>
                                    <span>Total</span>
                                    <span className={styles.expenseTotalValue}>{expense.amount.toFixed(2)}&nbsp;€</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        );
      })()}

    {/* Modal de edición de ticket */}
    {editingTicket && (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }} onClick={(e) => { if (e.target === e.currentTarget) setEditingTicket(null); }}>
        <div style={{
          background: '#1e293b', borderRadius: '16px', padding: '1.5rem',
          width: '100%', maxWidth: '420px', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.25rem', color: '#e2e8f0', fontSize: '1.1rem' }}>✏️ Editar Ticket</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.25rem' }}>Establecimiento</label>
              <input type="text" className="input-field" value={editModalStore} onChange={e => setEditModalStore(e.target.value)}
                style={{ width: '100%' }} placeholder="Ej. Mercadona" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.25rem' }}>Importe (€)</label>
                <input type="number" step="0.01" className="input-field" value={editModalAmount}
                  onChange={e => setEditModalAmount(e.target.value)} style={{ width: '100%' }} placeholder="0.00" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.25rem' }}>Fecha</label>
                <input type="date" className="input-field" value={editModalDate}
                  onChange={e => setEditModalDate(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.25rem' }}>Descripción</label>
              <input type="text" className="input-field" value={editModalDesc} onChange={e => setEditModalDesc(e.target.value)}
                style={{ width: '100%' }} placeholder="..." />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.25rem' }}>Categoría / Grupo</label>
              <select className="input-field" value={editModalGroup} onChange={e => setEditModalGroup(e.target.value)} style={{ width: '100%' }}>
                <option value="">Sin categoría (General)</option>
                {groups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.25rem' }}>Pagado de su bolsillo por</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="🔍 Filtrar asistentes..."
                    value={editModalContributorSearch}
                    onChange={e => setEditModalContributorSearch(e.target.value)}
                    style={{ width: '100%', paddingRight: '2rem' }}
                  />
                  {editModalContributorSearch && (
                    <button onClick={() => setEditModalContributorSearch('')}
                      style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                      title="Limpiar búsqueda">✕</button>
                  )}
                </div>
                <select className="input-field" value={editModalContributor} onChange={e => setEditModalContributor(e.target.value)} style={{ width: '100%' }}>
                  <option value="">Ninguno (del bote)</option>
                  {attendees
                    .filter((a: any) => !editModalContributorSearch ||
                      (a.user?.name || '').toLowerCase().includes(editModalContributorSearch.toLowerCase()) ||
                      (a.user?.username || '').toLowerCase().includes(editModalContributorSearch.toLowerCase())
                    )
                    .map((att: any) => <option key={att.id} value={att.id}>{att.user?.name || att.user?.username}</option>)
                  }
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditingTicket(null)} className="btn"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}>Cancelar</button>
            <button onClick={handleSaveEdit} disabled={isSavingEdit} className="btn"
              style={{ background: 'linear-gradient(135deg,#38bdf8,#818cf8)', color: '#fff', fontWeight: 700 }}>
              {isSavingEdit ? '⏳ Guardando...' : '✅ Guardar'}
            </button>
          </div>
        </div>
      </div>
    )}
    <ImageLightbox
      imageUrl={lightboxImage}
      onClose={() => { setLightboxImage(null); setLightboxExpense(null); }}
      onRescan={lightboxExpense && !lightboxExpense.isScanned ? () => handleReScan(lightboxExpense.id) : undefined}
      isRescanning={!!lightboxExpense && loading === `rescan-exp-${lightboxExpense.id}`}
    />
    </div>
  );
}
