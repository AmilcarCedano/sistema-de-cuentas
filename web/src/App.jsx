import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { 
  PlusCircle, Trash2, Edit3, ArrowUpCircle, ArrowDownCircle, 
  X, Wallet, PieChart, Home, ChevronRight, 
  Download, StickyNote, ChevronUp, ChevronDown,
  TrendingUp, TrendingDown, Layers, FolderPlus, Tag, Settings, Clock, Calendar,
  Eye, EyeOff, ShieldCheck, Target, BarChart3, Calculator, ArrowLeftRight, Filter, AlertCircle, CheckCircle,
  GripVertical, LayoutGrid, ArrowDownAZ, ArrowDown01, RefreshCw, Palette
} from 'lucide-react'
import * as XLSX from 'xlsx'
// Determinación dinámica de API para producción y VPS
const API = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : `https://api-sistema-cuentas.72.60.13.187.sslip.io/api`);
const CURRENCY = 'S/' 
const CATEGORY_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#64748b']

// --- HELPERS ---
const formatDate = (dateStr) => {
    const d = new Date(dateStr); const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return { dayName: days[d.getDay()], date: d.toLocaleDateString(), time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
}

const getSummary = (transactions = []) => {
    const activeTxs = transactions.filter(t => t.activo !== false)
    const inc = activeTxs.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
    const exp = activeTxs.filter(t => t.tipo === 'egreso').reduce((s, t) => s + t.monto, 0)
    return { inc, exp, net: inc - exp }
}

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
    <div className="bg-[#1a1f2e] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto p-8 border-b-0 sm:border-b">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#1a1f2e] z-10 py-2">
        <h3 className="text-2xl font-black tracking-tight text-white">{title}</h3>
        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><X size={26} className="text-white"/></button>
      </div>
      {children}
    </div>
  </div>
)

const Amount = ({ val, incognito, className }) => (
    <span className={className}>{incognito ? '****' : `${val < 0 ? '-' : ''}${CURRENCY}${Math.abs(val).toLocaleString()}`}</span>
)

const Accordion = ({ title, icon: Icon, open, onToggle, children, actions }) => (
  <div className="bg-[#141824] rounded-[30px] border border-white/5 overflow-hidden transition-all duration-300">
    <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={onToggle}>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-[#aab3cc] flex items-center gap-3">
        {Icon && <Icon size={18} className="text-accent" />} {title}
      </h3>
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {actions}
        <ChevronDown size={20} className={`text-text-muted transition-transform duration-300 ${open ? 'rotate-180 text-accent' : ''}`} />
      </div>
    </div>
    <div className={`transition-all duration-300 ease-in-out ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
      <div className="px-5 pb-5">{children}</div>
    </div>
  </div>
)

const ColorBlock = ({ title, amount, positive, icon: Icon }) => {
    const isPos = positive >= 0;
    const colorClass = isPos ? 'text-[#10b981]' : 'text-[#ef4444]';
    const borderColor = isPos ? 'border-[#10b981]/30 bg-[#10b981]/5' : 'border-[#ef4444]/30 bg-[#ef4444]/5';
    
    return (
        <div className={`p-7 rounded-[35px] shadow-lg transition-all border ${borderColor}`}>
            <div className="flex justify-between items-center">
                <div>
                    <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] mb-2 ${colorClass}`}>
                        {title}
                    </h4>
                    <h2 className={`text-4xl font-black tracking-tighter leading-none ${colorClass}`}>
                        {amount}
                    </h2>
                </div>
                {Icon && <Icon size={40} className={`${colorClass} opacity-60`} />}
            </div>
        </div>
    )
}

const getDiffTitle = (diff) => {
    if (diff === 0) return 'CONFORME'
    if (diff > 0) return 'GANANCIA'
    return 'DEBES'
}

const UnifiedColorPalette = ({ selectedColor, onSelect, savedColors, onAddColor, onRemoveColor, sizeClass = "w-10 h-10" }) => {
    const isNew = selectedColor && !savedColors.includes(selectedColor);
    return (
        <div className="flex flex-wrap gap-2 items-center">
            {savedColors.map(c => (
                <div key={c} className="relative group">
                    <button onClick={() => onSelect(c)} className={`${sizeClass} rounded-2xl sm:rounded-[20px] border-[3px] transition-all ${selectedColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                    <button onClick={(e) => onRemoveColor(c, e)} className="absolute -top-1.5 -right-1.5 bg-black/80 hover:bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg"><X size={10} className="text-white"/></button>
                </div>
            ))}
            <div className={`relative ${sizeClass} rounded-2xl sm:rounded-[20px] overflow-hidden border-[3px] border-white/40 hover:scale-110 transition-all cursor-pointer flex items-center justify-center shadow-lg`} style={{ backgroundColor: selectedColor || '#3b82f6' }} title="Color personalizado">
                <Palette size={14} className="text-white drop-shadow-md pointer-events-none" />
                <input type="color" value={selectedColor || '#3b82f6'} onChange={(e) => onSelect(e.target.value)} className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer opacity-0" />
            </div>
            {isNew && (
                <button onClick={() => onAddColor(selectedColor)} className="text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-accent text-white py-1.5 px-4 rounded-2xl transition-all flex items-center gap-1.5 shadow-lg h-9">
                    <PlusCircle size={12}/> Guardar Color
                </button>
            )}
        </div>
    )
}

// --- DRAGGABLE ROW COMPONENT ---
const DraggableRow = ({ tx, onEdit, onDelete, onToggleActivo, incognito, formatDate, onDragStart, onDragOver, onDrop, isDragging }) => {
    const f = formatDate(tx.fecha)
    const catColor = tx.grupo?.color
    const isActivo = tx.activo !== false
    
    return (
        <div 
            draggable={isActivo}
            onDragStart={(e) => onDragStart(e, tx.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, tx.id)}
            className={`flex flex-wrap sm:flex-nowrap items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all gap-3 ${isActivo ? 'cursor-grab active:cursor-grabbing hover:border-white/10' : 'cursor-not-allowed opacity-50'} ${isDragging ? 'opacity-50 scale-[0.98]' : ''}`}
            style={{ 
                backgroundColor: isActivo ? (catColor ? `${catColor}12` : 'rgba(255,255,255,0.03)') : 'rgba(0,0,0,0.3)',
                borderColor: isActivo ? (catColor ? `${catColor}25` : 'transparent') : 'rgba(255,255,255,0.1)',
                borderLeftWidth: isActivo ? (catColor ? '4px' : '1px') : '4px',
                borderLeftColor: isActivo ? (catColor || 'transparent') : '#64748b'
            }}
        >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {isActivo && <GripVertical size={14} className="text-white/20 flex-shrink-0" />}
                <div className={`text-[10px] sm:text-[12px] font-black uppercase tracking-widest flex-shrink-0 ${isActivo ? (tx.tipo === 'ingreso' ? 'text-[#10b981]' : 'text-[#ef4444]') : 'text-white/30'}`}>
                    {tx.tipo === 'ingreso' ? 'ING' : 'EGR'}
                </div>
                <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold leading-tight ${isActivo ? 'text-white/95' : 'text-white/30 line-through'}`}>{tx.titulo}</p>
                    <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-1 mt-0.5">
                        <p className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-tighter">{f.date} · {f.time}</p>
                        {tx.grupo && isActivo && (
                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter flex items-center gap-1" style={{ color: tx.grupo.color }}>
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: tx.grupo.color }}></span>
                                {tx.grupo.nombre}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {tx.comentario && isActivo && (
                    <button onClick={() => alert(tx.comentario)} className="p-1.5 sm:p-2 bg-white/5 text-white/40 hover:text-warning rounded-xl transition-all" title="Ver nota">
                        <StickyNote size={14} />
                    </button>
                )}
                <button 
                    onClick={() => onToggleActivo(tx.id, !isActivo)} 
                    className={`p-1.5 sm:p-2 rounded-xl transition-all ${isActivo ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 text-white/30 hover:bg-white/20'}`}
                    title={isActivo ? 'Desactivar' : 'Activar'}
                >
                    {isActivo ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                </button>
                <Amount val={tx.monto} incognito={incognito} className={`text-base sm:text-lg font-black ${isActivo ? (tx.tipo === 'ingreso' ? 'text-[#10b981]' : 'text-[#ef4444]') : 'text-white/30'}`} />
                <div className="flex gap-1">
                    <button onClick={()=>onEdit(tx)} className="p-1.5 sm:p-2 bg-white/5 text-white/40 hover:text-white rounded-xl transition-all"><Edit3 size={14} /></button>
                    <button onClick={()=>onDelete(tx.id)} className="p-1.5 sm:p-2 bg-white/5 text-white/40 hover:text-[#ef4444] rounded-xl transition-all"><Trash2 size={14} /></button>
                </div>
            </div>
        </div>
    )
}

// --- MAIN APP ---

const App = () => {
  const [cuentas, setCuentas] = useState([])
  const [notas, setNotas] = useState([])
  const [activeTab, setActiveTab] = useState('home')
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [incognito, setIncognito] = useState(false)
  const [showKpiSettings, setShowKpiSettings] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [syncError, setSyncError] = useState(null)
  
  // Historial view mode
  const [historialMode, setHistorialMode] = useState('list') // 'list' | 'split'
  const [sortMode, setSortMode] = useState('custom') // 'custom' | 'date' | 'category'
  const [draggedId, setDraggedId] = useState(null)

  const [uiState, setUiState] = useState({ homeStats: true, homeNotes: true, accStats: true, accAudit: true, accHistory: true, accCategories: false })

  // Modals
  const [isAccountModal, setIsAccountModal] = useState(false)
  const [accountForm, setAccountForm] = useState({ nombre: '', color: '#3b82f6', id: "" })
  
  const [isTxModal, setIsTxModal] = useState(false)
  const [txMode, setTxMode] = useState('create')
  const [txForm, setTxForm] = useState({ titulo: '', monto: '', tipo: 'ingreso', comentario: '', fecha: '', cuentaId: '', id: '', grupoId: '' })

  const [isManualModal, setIsManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({ nombre: '', monto: '' })

  const [isNoteModal, setIsNoteModal] = useState(false)
  const [noteForm, setNoteForm] = useState({ id: null, contenido: '', color: '#fcd34d' })

  const [isExportModal, setShowExportModal] = useState(false)
  const [exportAccountId, setExportAccountId] = useState("all")

  // Category inline form
  const [catFormOpen, setCatFormOpen] = useState(null)
  const [catForm, setCatForm] = useState({ nombre: '', color: '#3b82f6' })

  // --- SAVED COLORS PALETTE ---
  const [savedColors, setSavedColors] = useState(() => {
    try {
      const saved = localStorage.getItem('fincontrol_colors');
      return saved ? JSON.parse(saved) : ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'];
    } catch {
      return ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'];
    }
  });

  const handleAddColor = (color) => {
    if (!savedColors.includes(color)) {
      const newColors = [...savedColors, color];
      setSavedColors(newColors);
      localStorage.setItem('fincontrol_colors', JSON.stringify(newColors));
    }
  };

  const handleRemoveColor = (colorToRemove, e) => {
    e.stopPropagation();
    const newColors = savedColors.filter(c => c !== colorToRemove);
    setSavedColors(newColors);
    localStorage.setItem('fincontrol_colors', JSON.stringify(newColors));
  };

  // --- DATA LOADING ---
  const cargarCuentas = useCallback(async (showError = true) => {
    try {
      const resp = await fetch(`${API}/cuentas`)
      if (resp.ok) {
        setCuentas(await resp.json())
        setIsOnline(true)
        setSyncError(null)
      } else {
        if (showError) setSyncError('Error de sincronización')
      }
    } catch (e) { 
      setIsOnline(false)
      if (showError) setSyncError('Sin conexión al servidor')
    }
  }, [])

  const cargarNotas = useCallback(async () => {
    try {
      const resp = await fetch(`${API}/notas`)
      if (resp.ok) setNotas(await resp.json())
    } catch (e) { 
      console.error('Error cargando notas')
    }
  }, [])

  useEffect(() => { 
    cargarCuentas(false)
    cargarNotas() 
    const interval = setInterval(() => cargarCuentas(false), 5000)
    return () => clearInterval(interval)
  }, [])

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e, txId) => {
    setDraggedId(txId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetId) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const cuenta = cuentas.find(c => c.id === selectedAccountId)
    if (!cuenta) return

    const txs = [...(cuenta.transacciones || [])]
    const draggedIndex = txs.findIndex(t => t.id === draggedId)
    const targetIndex = txs.findIndex(t => t.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reorder
    const [dragged] = txs.splice(draggedIndex, 1)
    txs.splice(targetIndex, 0, dragged)

    // Update local state immediately for smooth UI
    setCuentas(prev => prev.map(c => {
      if (c.id === selectedAccountId) {
        return {
          ...c,
          transacciones: txs.map((t, i) => ({ ...t, orden: i }))
        }
      }
      return c
    }))

    // Send to server
    const ordenes = txs.map((t, i) => ({ id: t.id, orden: i }))
    try {
      await fetch(`${API}/cuentas/${selectedAccountId}/transacciones/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenes })
      })
    } catch (e) {
      console.error('Error reordering')
      await cargarCuentas() // Reload on error
    }

    setDraggedId(null)
  }

  // --- HANDLERS ---
  const handleSaveAccount = async () => {
    const url = accountForm.id ? `${API}/cuentas/${accountForm.id}` : `${API}/cuentas`
    setIsAccountModal(false)
    if (accountForm.id) {
      setCuentas(prev => prev.map(c => c.id === accountForm.id ? { ...c, nombre: accountForm.nombre, color: accountForm.color } : c))
    }
    await fetch(url, { method: accountForm.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(accountForm) })
    await cargarCuentas()
  }

  const handleToggleKpi = async (cuenta) => {
    const newValue = !cuenta.incluirEnKpis
    setCuentas(prev => prev.map(c => c.id === cuenta.id ? { ...c, incluirEnKpis: newValue } : c))
    try {
      await fetch(`${API}/cuentas/${cuenta.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ incluirEnKpis: newValue }) })
    } catch (e) {
      setCuentas(prev => prev.map(c => c.id === cuenta.id ? { ...c, incluirEnKpis: !newValue } : c))
      setSyncError('Error sincronizando')
    }
  }

  const handleSaveTx = async () => {
    const cid = txForm.cuentaId || selectedAccountId
    if (!cid) return alert('Selecciona una cuenta')
    const finalData = { titulo: txForm.titulo, monto: parseFloat(txForm.monto), tipo: txForm.tipo, comentario: txForm.comentario || '', fecha: new Date().toISOString(), grupoId: txForm.grupoId || null }
    const url = txMode === 'create' ? `${API}/cuentas/${cid}/transacciones` : `${API}/transacciones/${txForm.id}`
    
    if (txMode === 'create') {
      const tempTx = { ...finalData, id: Date.now(), cuentaId: parseInt(cid), fecha: new Date(), orden: 0 }
      setCuentas(prev => prev.map(c => {
        if (c.id === parseInt(cid)) {
          return { ...c, transacciones: [tempTx, ...(c.transacciones || [])] }
        }
        return c
      }))
    }
    
    setIsTxModal(false)
    await fetch(url, { method: txMode === 'create' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalData) })
    await cargarCuentas()
  }

  const handleSaveManual = async () => {
    const tempSaldo = { id: Date.now(), nombre: manualForm.nombre, monto: parseFloat(manualForm.monto), cuentaId: selectedAccountId }
    setCuentas(prev => prev.map(c => {
      if (c.id === selectedAccountId) {
        return { ...c, saldosManuales: [...(c.saldosManuales || []), tempSaldo] }
      }
      return c
    }))
    setIsManualModal(false)
    setManualForm({ nombre: '', monto: '' })
    await fetch(`${API}/cuentas/${selectedAccountId}/saldos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(manualForm) })
    await cargarCuentas()
  }

  const handleDeleteManual = async (id) => {
    if (!confirm('¿Eliminar saldo manual?')) return
    setCuentas(prev => prev.map(c => {
      if (c.id === selectedAccountId) {
        return { ...c, saldosManuales: c.saldosManuales?.filter(s => s.id !== id) }
      }
      return c
    }))
    await fetch(`${API}/saldos/${id}`, { method: 'DELETE' })
    await cargarCuentas()
  }

  const handleDeleteTx = async (txId) => {
    if (!confirm('¿Eliminar movimiento?')) return
    setCuentas(prev => prev.map(c => {
      if (c.id === selectedAccountId) {
        return { ...c, transacciones: c.transacciones?.filter(t => t.id !== txId) }
      }
      return c
    }))
    await fetch(`${API}/transacciones/${txId}`, { method: 'DELETE' })
    await cargarCuentas()
  }

  const handleToggleActivo = async (txId, activo) => {
    setCuentas(prev => prev.map(c => {
      if (c.id === selectedAccountId) {
        return {
          ...c,
          transacciones: c.transacciones?.map(t => t.id === txId ? { ...t, activo } : t)
        }
      }
      return c
    }))
    await fetch(`${API}/transacciones/${txId}/activo`, { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ activo }) 
    })
  }

  const handleDeleteNote = async (noteId) => {
    setNotas(prev => prev.filter(n => n.id !== noteId))
    await fetch(`${API}/notas/${noteId}`, { method: 'DELETE' })
  }

  const handleSaveNote = async () => {
    if (!noteForm.contenido.trim()) return;
    const isEdit = !!noteForm.id;
    const url = isEdit ? `${API}/notas/${noteForm.id}` : `${API}/notas`
    const method = isEdit ? 'PUT' : 'POST'
    
    setIsNoteModal(false)
    
    // Optimistic UI
    if (isEdit) {
      setNotas(prev => prev.map(n => n.id === noteForm.id ? { ...n, contenido: noteForm.contenido, color: noteForm.color } : n))
    } else {
      const tempNote = { id: Date.now(), contenido: noteForm.contenido, color: noteForm.color, createdAt: new Date() }
      setNotas(prev => [tempNote, ...prev])
    }

    try {
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(noteForm) })
      await cargarNotas()
    } catch (e) {
      console.error('Error saving note', e)
    }
  }

  const handleEditNote = (note) => {
    setNoteForm({ id: note.id, contenido: note.contenido, color: note.color || '#fcd34d' })
    setIsNoteModal(true)
  }

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('¿Eliminar esta cuenta y todos sus datos?')) return
    setSelectedAccountId("")
    setCuentas(prev => prev.filter(c => c.id !== accountId))
    await fetch(`${API}/cuentas/${accountId}`, { method: 'DELETE' })
    await cargarCuentas()
  }

  const handleEditTx = (tx) => {
    setTxMode('edit')
    setTxForm({ titulo: tx.titulo, monto: tx.monto, tipo: tx.tipo, comentario: tx.comentario || '', fecha: new Date(tx.fecha).toISOString().slice(0, 16), cuentaId: tx.cuentaId, id: tx.id, grupoId: tx.grupoId || '' })
    setIsTxModal(true)
  }

  const handleSelectAccount = (id) => {
    setSelectedAccountId(prev => prev === id ? "" : id)
    setCatFormOpen(null)
  }

  // --- CATEGORIES ---
  const handleSaveCategory = async (cuentaId) => {
    if (!catForm.nombre.trim()) return
    await fetch(`${API}/cuentas/${cuentaId}/grupos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) })
    setCatForm({ nombre: '', color: '#3b82f6' })
    setCatFormOpen(null)
    await cargarCuentas()
  }

  const handleDeleteCategory = async (grupoId) => {
    if (confirm('¿Eliminar esta categoría? Las transacciones no se borrarán.')) {
      await fetch(`${API}/grupos/${grupoId}`, { method: 'DELETE' })
      await cargarCuentas()
    }
  }

  // --- EXCEL EXPORT ---
  const exportAllToExcel = (targetAccountId = null) => {
    const wb = XLSX.utils.book_new()
    
    const cuentasToExport = targetAccountId 
        ? cuentas.filter(c => String(c.id) === String(targetAccountId))
        : cuentas
        
    cuentasToExport.forEach(cuenta => {
      let activeTxs = (cuenta.transacciones || []).filter(t => t.activo !== false)
      activeTxs = activeTxs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      
      const ingresos = activeTxs.filter(t => t.tipo === 'ingreso')
      const egresos = activeTxs.filter(t => t.tipo === 'egreso')
      
      const sumInc = ingresos.reduce((s, t) => s + t.monto, 0)
      const sumExp = egresos.reduce((s, t) => s + t.monto, 0)
      const net = sumInc - sumExp
      
      const aoa = []
      
      aoa.push([`REPORTE DE BILLETERA: ${cuenta.nombre}`])
      aoa.push([])
      
      // TABLA DE INGRESOS
      aoa.push(['--- TABLA DE INGRESOS ---'])
      aoa.push(['Fecha', 'Hora', 'Categoría', 'Concepto', 'Nota', 'Monto'])
      ingresos.forEach(t => {
        aoa.push([formatDate(t.fecha).date, formatDate(t.fecha).time, t.grupo?.nombre || 'Sin categoría', t.titulo, t.comentario || '', t.monto])
      })
      aoa.push(['', '', '', '', 'TOTAL INGRESOS:', sumInc])
      aoa.push([])
      aoa.push([])
      
      // TABLA DE EGRESOS
      aoa.push(['--- TABLA DE EGRESOS ---'])
      aoa.push(['Fecha', 'Hora', 'Categoría', 'Concepto', 'Nota', 'Monto'])
      egresos.forEach(t => {
        aoa.push([formatDate(t.fecha).date, formatDate(t.fecha).time, t.grupo?.nombre || 'Sin categoría', t.titulo, t.comentario || '', t.monto])
      })
      aoa.push(['', '', '', '', 'TOTAL EGRESOS:', sumExp])
      aoa.push([])
      aoa.push([])
      
      // RESUMEN FINAL
      aoa.push(['--- RESUMEN FINAL ---'])
      aoa.push(['Total de Ganancias', sumInc])
      aoa.push(['Total de Gastos', sumExp])
      aoa.push(['Monto Real (Neto)', net])
      
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      
      // Añadir anchos de columna para que se vea bien
      ws['!cols'] = [{wch: 12}, {wch: 10}, {wch: 20}, {wch: 30}, {wch: 35}, {wch: 15}]
      
      const cuentaName = cuenta.nombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31) || 'Cuenta'
      XLSX.utils.book_append_sheet(wb, ws, cuentaName)
    })
    
    // Si no hay cuentas, crear una hoja vacía para que no falle
    if (cuentas.length === 0) {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['No hay cuentas registradas']])
        XLSX.utils.book_append_sheet(wb, wsEmpty, 'Vacio')
    }
    
    XLSX.writeFile(wb, "Reporte_FinControl.xlsx")
  }

  const handleExportWithPrompt = () => {
    setShowExportModal(true)
  }

  const handleExportExcel = (sortBy) => {
    exportAllToExcel(sortBy)
    setShowExportModal(false)
  }

  // --- SORT HELPERS ---
  const getSortedTransactions = (transacciones, mode) => {
    if (!transacciones) return []
    const txs = [...transacciones]
    
    if (mode === 'date') {
      return txs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    }
    if (mode === 'category') {
      return txs.sort((a, b) => {
        const catA = a.grupo?.nombre || 'zzz'
        const catB = b.grupo?.nombre || 'zzz'
        if (catA !== catB) return catA.localeCompare(catB)
        return new Date(b.fecha) - new Date(a.fecha)
      })
    }
    return txs // 'custom' - use existing orden
  }

  const totals = useMemo(() => {
    let inc = 0, exp = 0, real = 0, hasManual = false
    cuentas.filter(c => c.incluirEnKpis).forEach(c => {
        const s = getSummary(c.transacciones)
        inc += s.inc; exp += s.exp
        if (c.saldosManuales && c.saldosManuales.length > 0) {
            hasManual = true
            real += c.saldosManuales.reduce((sum, m) => sum + m.monto, 0)
        }
    })
    const net = inc - exp; const diff = real - net
    return { inc, exp, net, real, diff, hasManual }
  }, [cuentas])

  const txAccountId = txForm.cuentaId || selectedAccountId
  const txAccount = cuentas.find(c => String(c.id) === String(txAccountId))
  const availableGroups = txAccount?.grupos || []

  // --- HISTORIAL SPLIT MODE ---
  // Get two arrays: one for incomes, one for expenses, aligned by category
  const getColumnsTransactions = (transacciones) => {
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso' && t.activo !== false)
    const egresos = transacciones.filter(t => t.tipo === 'egreso' && t.activo !== false)
    
    // Get all unique categories
    const allCategories = []
    const seen = new Set()
    
    ingresos.forEach(t => {
      const cat = t.grupo?.nombre || 'Sin categoría'
      if (!seen.has(cat)) {
        seen.add(cat)
        allCategories.push({ nombre: cat, color: t.grupo?.color })
      }
    })
    egresos.forEach(t => {
      const cat = t.grupo?.nombre || 'Sin categoría'
      if (!seen.has(cat)) {
        seen.add(cat)
        allCategories.push({ nombre: cat, color: t.grupo?.color })
      }
    })
    
    // Align by category
    const rows = allCategories.map(cat => {
      const incs = ingresos.filter(t => (t.grupo?.nombre || 'Sin categoría') === cat.nombre)
      const egrs = egresos.filter(t => (t.grupo?.nombre || 'Sin categoría') === cat.nombre)
      return { category: cat, ingresos: incs, egresos: egrs }
    })
    
    return rows
  }

  // --- VIEWS ---

  const HomeView = () => (
    <div className="space-y-6 pb-40">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-lg font-black text-white/90 uppercase tracking-widest flex items-center gap-2"><BarChart3 size={20} className="text-accent" /> Panel General</h2>
        <button onClick={() => setShowKpiSettings(!showKpiSettings)} className={`p-3 rounded-2xl transition-all ${showKpiSettings ? 'bg-accent text-white shadow-lg' : 'bg-white/5 text-text-muted hover:bg-white/10'}`}><Filter size={20} /></button>
      </div>

      {showKpiSettings && (
        <div className="p-6 bg-[#1a1f2e] rounded-[30px] border border-white/10 animate-slide-down shadow-xl mb-4 mx-2">
          <p className="text-[10px] font-black uppercase text-accent mb-4 pl-1">Seleccionar Cuentas Visibles</p>
          <div className="flex flex-wrap gap-2">
            {cuentas.map(c => (
              <button key={c.id} onClick={() => handleToggleKpi(c)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${c.incluirEnKpis ? 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20' : 'bg-white/5 text-white/30'}`}>{c.nombre}</button>
            ))}
          </div>
        </div>
      )}

      <Accordion title="Estado Financiero Global" icon={Layers} open={uiState.homeStats} onToggle={() => setUiState(s => ({...s, homeStats: !s.homeStats}))}>
          <div className="space-y-6 mt-2">
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#10b981]/5 p-6 rounded-[30px] border border-[#10b981]/20 shadow-sm">
                      <p className="text-[#10b981] text-[9px] font-black uppercase tracking-widest leading-none mb-2">Total Ganancias</p>
                      <h3 className="text-2xl font-black tracking-tighter text-[#10b981]"><Amount val={totals.inc} incognito={incognito} /></h3>
                  </div>
                  <div className="bg-[#ef4444]/5 p-6 rounded-[30px] border border-[#ef4444]/20 shadow-sm">
                      <p className="text-[#ef4444] text-[9px] font-black uppercase tracking-widest leading-none mb-2">Total Gastos</p>
                      <h3 className="text-2xl font-black tracking-tighter text-[#ef4444]"><Amount val={totals.exp} incognito={incognito} /></h3>
                  </div>
              </div>

              <ColorBlock 
                  title="Monto Real" 
                  amount={<Amount val={Math.abs(totals.net)} incognito={incognito}/>} 
                  positive={totals.net} 
                  icon={Wallet} 
              />
          </div>
      </Accordion>

      {totals.hasManual && (
          <Accordion title="Auditoría / Arqueos Consolidados" icon={ShieldCheck} open={uiState.homeNotes} onToggle={() => setUiState(s => ({...s, homeNotes: !s.homeNotes}))}>
               <div className="mt-2">
                  <ColorBlock 
                      title={getDiffTitle(totals.diff)} 
                      amount={<Amount val={Math.abs(totals.diff)} incognito={incognito}/>} 
                      positive={totals.diff} 
                      icon={totals.diff === 0 ? CheckCircle : Calculator} 
                  />
               </div>
          </Accordion>
      )}

      <button onClick={handleExportWithPrompt} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-[35px] flex items-center justify-center gap-3 text-xs font-black text-white/80 transition-all active:scale-95 shadow-lg"><Download size={20} className="text-accent" /> Descargar Excel Completo</button>

      <section className="px-2">
        <div className="flex justify-between items-center mb-4 mt-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#aab3cc] flex items-center gap-2"><StickyNote size={14} className="text-warning" /> Apuntes y Notas</h3>
          <button onClick={() => { setNoteForm({id: null, contenido: '', color: '#fcd34d'}); setIsNoteModal(true) }} className="p-2 bg-white/5 rounded-xl text-warning hover:bg-white/10 transition-all"><PlusCircle size={18} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notas.map(n => (
            <div key={n.id} onClick={() => handleEditNote(n)} className="relative p-6 rounded-[28px] border border-white/5 bg-[#141824] cursor-pointer hover:border-warning/30 transition-all shadow-sm border-l-[4px]" style={{ borderLeftColor: n.color || '#fcd34d' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteNote(n.id) }} 
                className="absolute top-4 right-4 p-2 text-white/20 hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                title="Eliminar"
              >
                <X size={16} />
              </button>
              <p className="text-sm font-bold text-white/90 leading-relaxed pr-6 whitespace-pre-wrap">{n.contenido}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )

  const CuentasView = () => (
    <div className="space-y-6 pb-40">
      <header className="flex justify-between items-center bg-[#1a1f2e]/90 backdrop-blur-md p-5 rounded-[30px] border border-white/10 sticky top-[84px] z-30 shadow-2xl">
        <h2 className="text-lg font-black tracking-tighter text-white">Billeteras & Caja</h2>
        <button onClick={() => { setAccountForm({nombre:'', color:'#3b82f6', id: ""}); setIsAccountModal(true) }} className="bg-accent text-white py-2.5 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">Crear Billetera</button>
      </header>

      <div className="space-y-6">
        {cuentas.map(c => {
          const isSelected = selectedAccountId === c.id
          const sm = getSummary(c.transacciones)
          const hasManual = (c.saldosManuales || []).length > 0
          const totalManual = hasManual ? c.saldosManuales.reduce((s, m) => s + m.monto, 0) : 0
          const localDiff = totalManual - sm.net
          
          return (
            <div key={c.id} className={`rounded-[40px] border transition-all duration-300 ${isSelected ? 'border-accent bg-[#1a1f2e] shadow-2xl mt-4 mb-8 scale-[1.01]' : 'border-white/5 bg-[#141824] hover:bg-[#1a1f2e] shadow-md'}`}>
              <div className="p-8 flex items-center justify-between cursor-pointer" onClick={() => handleSelectAccount(c.id)}>
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg border border-white/10 text-white" style={{ backgroundColor: c.color }}><Wallet size={30} /></div>
                    <div>
                        <h3 className="font-black text-2xl tracking-tighter text-white">{c.nombre}</h3>
                        <div className="mt-1.5"><Amount val={sm.net} incognito={incognito} className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-white/5 ${sm.net >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`} /></div>
                    </div>
                </div>
                <ChevronDown size={28} className={`text-text-muted transition-transform duration-500 ${isSelected ? 'rotate-180 text-accent' : ''}`} />
              </div>

              {isSelected && (
                <div className="px-4 sm:px-8 pb-8 space-y-4">
                  <div className="grid grid-cols-1 gap-3 p-3 bg-white/5 rounded-3xl mb-6">
                    <div className="flex gap-3">
                        <button onClick={() => { setTxMode('create'); setTxForm({titulo:'', monto:'', tipo:'egreso', comentario: '', cuentaId: c.id, grupoId: ''}); setIsTxModal(true) }} className="flex-1 py-4 bg-[#ef4444] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"><ArrowDownCircle size={18}/> Salida</button>
                        <button onClick={() => { setTxMode('create'); setTxForm({titulo:'', monto:'', tipo:'ingreso', comentario: '', cuentaId: c.id, grupoId: ''}); setIsTxModal(true) }} className="flex-1 py-4 bg-[#10b981] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"><ArrowUpCircle size={18}/> Entrada</button>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsManualModal(true)} className="flex-1 py-3 bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-accent/20 transition-all"><Calculator size={16} className="inline mr-2"/> Saldo Físico</button>
                        <button onClick={() => handleDeleteAccount(c.id)} className="p-3 bg-white/5 rounded-2xl text-danger/40 hover:text-danger hover:bg-danger/10 px-6 transition-all"><Trash2 size={20}/></button>
                    </div>
                  </div>

                  {/* ── CATEGORÍAS ── */}
                  <Accordion title="Categorías" icon={Tag} open={uiState.accCategories} onToggle={() => setUiState(s => ({...s, accCategories: !s.accCategories}))}>
                    <div className="space-y-4 mt-2">
                      <div className="flex flex-wrap gap-2">
                        {(c.grupos || []).length === 0 && <p className="text-[10px] text-white/20 italic">Sin categorías aún.</p>}
                        {(c.grupos || []).map(g => (
                          <div key={g.id} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all hover:scale-105" style={{ backgroundColor: `${g.color}18`, border: `1px solid ${g.color}35` }}>
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: g.color }}></div>
                            <span style={{ color: g.color }}>{g.nombre}</span>
                            <button onClick={() => handleDeleteCategory(g.id)} className="ml-1 opacity-30 hover:opacity-100 transition-opacity"><X size={12} style={{ color: g.color }}/></button>
                          </div>
                        ))}
                      </div>

                      {catFormOpen === c.id ? (
                        <div className="bg-white/5 p-5 rounded-2xl space-y-4 animate-slide-down border border-white/5">
                          <input autoFocus placeholder="Nombre de categoría" className="w-full bg-white/5 border border-white/10 py-3.5 px-5 rounded-2xl text-white font-bold text-sm outline-none focus:border-accent transition-all" value={catForm.nombre} onChange={e => setCatForm({...catForm, nombre: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleSaveCategory(c.id)} />
                          <UnifiedColorPalette 
                            selectedColor={catForm.color} 
                            onSelect={(c) => setCatForm({...catForm, color: c})} 
                            savedColors={savedColors} 
                            onAddColor={handleAddColor} 
                            onRemoveColor={handleRemoveColor} 
                            sizeClass="w-9 h-9"
                          />
                          <div className="flex gap-3">
                            <button onClick={() => setCatFormOpen(null)} className="flex-1 py-3.5 bg-white/5 rounded-2xl text-[10px] font-black text-white/40 hover:text-white/60 transition-all">Cancelar</button>
                            <button onClick={() => handleSaveCategory(c.id)} className="flex-1 py-3.5 bg-accent rounded-2xl text-[10px] font-black text-white shadow-lg hover:brightness-110 active:scale-95 transition-all">Guardar</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setCatFormOpen(c.id); setCatForm({ nombre: '', color: '#3b82f6' }) }} className="w-full py-3.5 bg-white/5 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/30 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                          <PlusCircle size={14}/> Agregar Categoría
                        </button>
                      )}
                    </div>
                  </Accordion>

                  <Accordion title="Estado y Flujo Libre" icon={TrendingUp} open={uiState.accStats} onToggle={() => setUiState(s => ({...s, accStats: !s.accStats}))}>
                      <div className="space-y-6 mt-2">
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1.5 leading-none">Total de Ganancias</p>
                                  <Amount val={sm.inc} incognito={incognito} className="text-xl font-black text-[#10b981]" />
                              </div>
                              <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1.5 leading-none">Total de Gastos</p>
                                  <Amount val={sm.exp} incognito={incognito} className="text-xl font-black text-[#ef4444]" />
                              </div>
                          </div>
                      
                          <ColorBlock 
                              title="Monto Real" 
                              amount={<Amount val={Math.abs(sm.net)} incognito={incognito}/>} 
                              positive={sm.net} 
                              icon={Wallet} 
                          />
                      </div>
                  </Accordion>

                  {hasManual && (
                     <Accordion title="Auditoría de Arqueo" icon={ShieldCheck} open={uiState.accAudit} onToggle={() => setUiState(s => ({...s, accAudit: !s.accAudit}))}>
                         <div className="space-y-6 mt-2">
                             <div className="bg-[#141824] rounded-3xl p-2 border border-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                 <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-accent/60 px-4 py-3 border-b border-white/5"><span>Saldos Físicos Detectados</span></div>
                                 {c.saldosManuales.map(m => (
                                     <div key={m.id} className="flex justify-between items-center p-4 py-3 last:border-none border-b border-white/5">
                                         <span className="text-[10px] font-black text-white/60">{m.nombre}</span>
                                         <div className="flex items-center gap-5">
                                             <Amount val={m.monto} className="text-sm font-black text-white" />
                                             <button onClick={()=>handleDeleteManual(m.id)} className="text-danger/40 hover:text-danger p-1 bg-white/5 rounded-lg transition-all"><X size={14}/></button>
                                         </div>
                                     </div>
                                 ))}
                             </div>

                             <ColorBlock 
                                 title={getDiffTitle(localDiff)} 
                                 amount={<Amount val={Math.abs(localDiff)} incognito={incognito}/>} 
                                 positive={localDiff} 
                                 icon={localDiff === 0 ? CheckCircle : Calculator} 
                             />
                         </div>
                     </Accordion>
                  )}

                  {/* ── HISTORIAL WITH SPLIT MODE ── */}
                  <Accordion 
                    title="Historial de Operaciones" 
                    icon={FolderPlus} 
                    open={uiState.accHistory} 
                    onToggle={() => setUiState(s => ({...s, accHistory: !s.accHistory}))}
                    actions={
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSortMode(m => m === 'date' ? 'custom' : 'date')}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[9px] font-black uppercase ${sortMode === 'date' ? 'bg-accent text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                          title="Ordenar por fecha"
                        >
                          <Calendar size={12} />
                          <span className="hidden sm:inline">Fecha</span>
                        </button>
                        <button 
                          onClick={() => setSortMode(m => m === 'category' ? 'custom' : 'category')}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[9px] font-black uppercase ${sortMode === 'category' ? 'bg-accent text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                          title="Ordenar por categoría"
                        >
                          <Tag size={12} />
                          <span className="hidden sm:inline">Categoría</span>
                        </button>
                        <button 
                          onClick={() => setHistorialMode(m => m === 'list' ? 'split' : 'list')}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[9px] font-black uppercase ${historialMode === 'split' ? 'bg-accent text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                          title={historialMode === 'list' ? 'Cambiar a columnas' : 'Cambiar a lista'}
                        >
                          <LayoutGrid size={12} />
                          <span className="hidden sm:inline">{historialMode === 'list' ? 'Lista' : 'Columnas'}</span>
                        </button>
                      </div>
                    }
                  >
                    {historialMode === 'list' ? (
                      <div className="space-y-3 mt-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {getSortedTransactions(c.transacciones || [], sortMode).map(tx => (
                          <DraggableRow 
                            key={tx.id} 
                            tx={tx} 
                            onEdit={handleEditTx} 
                            onDelete={handleDeleteTx}
                            onToggleActivo={handleToggleActivo}
                            incognito={incognito}
                            formatDate={formatDate}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            isDragging={draggedId === tx.id}
                          />
                        ))}
                        {(c.transacciones || []).length === 0 && <p className="text-[10px] text-white/20 italic text-center py-4">No hay movimientos registrados.</p>}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl">
                            <ArrowUpCircle size={16} className="text-[#10b981]" />
                            <span className="text-[10px] font-black uppercase text-[#10b981]">Ingresos</span>
                          </div>
                          {(c.transacciones || []).filter(t => t.tipo === 'ingreso' && t.activo !== false).length === 0 ? (
                            <p className="text-[10px] text-white/20 italic text-center py-4">Sin ingresos</p>
                          ) : (
                            getSortedTransactions(c.transacciones || [], sortMode)
                              .filter(t => t.tipo === 'ingreso' && t.activo !== false)
                              .map(tx => (
                                <div key={tx.id} 
                                  className="flex items-center justify-between p-3 rounded-xl border-l-2"
                                  style={{ 
                                    backgroundColor: tx.grupo ? `${tx.grupo.color}10` : 'rgba(255,255,255,0.03)',
                                    borderLeftColor: tx.grupo?.color || '#10b981'
                                  }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white/95">{tx.titulo}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-[8px] text-white/30">{formatDate(tx.fecha).date} · {formatDate(tx.fecha).time}</p>
                                      {tx.grupo && (
                                        <span className="text-[8px] flex items-center gap-1" style={{ color: tx.grupo.color }}>
                                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.grupo.color }}></span>
                                          {tx.grupo.nombre}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Amount val={tx.monto} incognito={incognito} className="text-base font-black text-[#10b981]" />
                                    <button onClick={()=>handleEditTx(tx)} className="p-1.5 bg-white/5 text-white/30 hover:text-white rounded-lg transition-all"><Edit3 size={12} /></button>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl">
                            <ArrowDownCircle size={16} className="text-[#ef4444]" />
                            <span className="text-[10px] font-black uppercase text-[#ef4444]">Egresos</span>
                          </div>
                          {(c.transacciones || []).filter(t => t.tipo === 'egreso' && t.activo !== false).length === 0 ? (
                            <p className="text-[10px] text-white/20 italic text-center py-4">Sin egresos</p>
                          ) : (
                            getSortedTransactions(c.transacciones || [], sortMode)
                              .filter(t => t.tipo === 'egreso' && t.activo !== false)
                              .map(tx => (
                                <div key={tx.id} 
                                  className="flex items-center justify-between p-3 rounded-xl border-l-2"
                                  style={{ 
                                    backgroundColor: tx.grupo ? `${tx.grupo.color}10` : 'rgba(255,255,255,0.03)',
                                    borderLeftColor: tx.grupo?.color || '#ef4444'
                                  }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white/95">{tx.titulo}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-[8px] text-white/30">{formatDate(tx.fecha).date} · {formatDate(tx.fecha).time}</p>
                                      {tx.grupo && (
                                        <span className="text-[8px] flex items-center gap-1" style={{ color: tx.grupo.color }}>
                                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.grupo.color }}></span>
                                          {tx.grupo.nombre}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Amount val={tx.monto} incognito={incognito} className="text-base font-black text-[#ef4444]" />
                                    <button onClick={()=>handleEditTx(tx)} className="p-1.5 bg-white/5 text-white/30 hover:text-white rounded-lg transition-all"><Edit3 size={12} /></button>
                                  </div>
                                </div>
                                ))
                          )}
                        </div>
                      </div>
                    )}
                  </Accordion>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white font-sans selection:bg-accent/40 selection:text-white overflow-x-hidden">
      <header className="glass sticky top-0 z-[60] px-6 py-7 flex items-center justify-between border-b border-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20"><Wallet size={28} /></div>
            <div>
              <h1 className="font-black text-xl tracking-tighter leading-none text-white">SISTEMA DE CUENTAS</h1>
              <p className="text-[9px] font-black text-[#aab3cc] uppercase tracking-[0.4em] mt-2">Auditoría Financiera</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
          {syncError && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-xl">
              <AlertCircle size={14} className="text-red-400" />
              <span className="text-[10px] font-black text-red-400">{syncError}</span>
            </div>
          )}
          {!isOnline && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
              <AlertCircle size={14} className="text-yellow-400" />
              <span className="text-[10px] font-black text-yellow-400">Sin conexión</span>
            </div>
          )}
          {isOnline && !syncError && cuentas.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-xl">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-[10px] font-black text-green-400">Sincronizado</span>
            </div>
          )}
          <button onClick={()=>setIncognito(!incognito)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
              {incognito ? <EyeOff size={24} className="text-white/30"/> : <Eye size={24} className="text-accent group-hover:scale-110 transition-transform"/>}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'home' && HomeView()}
          {activeTab === 'wallet' && CuentasView()}
        </div>
      </main>

      <div className="fixed bottom-8 left-0 right-0 z-[60] px-6 sm:px-0 pointer-events-none">
        <nav className="max-w-[340px] mx-auto bg-[#1a1f2e]/90 backdrop-blur-3xl p-3 rounded-[50px] flex justify-between items-center shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 pointer-events-auto">
          <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center py-4 rounded-[40px] transition-all ${activeTab === 'home' ? 'bg-white text-[#0c0e14] font-black shadow-2xl' : 'text-[#aab3cc] hover:text-white'}`}><Home size={24} /><span className="text-[9px] font-black uppercase mt-1.5">Métricas</span></button>
          <button onClick={() => { setTxMode('create'); setTxForm({titulo:'', monto:'', tipo:'ingreso', comentario:'', fecha: '', cuentaId: '', grupoId: ''}); setIsTxModal(true) }} className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white mx-3 shadow-2xl active:scale-95 transition-transform"><PlusCircle size={38} /></button>
          <button onClick={() => setActiveTab('wallet')} className={`flex-1 flex flex-col items-center py-4 rounded-[40px] transition-all ${activeTab === 'wallet' ? 'bg-white text-[#0c0e14] font-black shadow-2xl' : 'text-[#aab3cc] hover:text-white'}`}><Wallet size={24} /><span className="text-[9px] font-black uppercase mt-1.5">Billeteras</span></button>
        </nav>
      </div>

      {/* ═══════════ MODALS ═══════════ */}

      {isAccountModal && <Modal title={accountForm.id ? 'Ajustes de Billetera' : 'Nueva Billetera'} onClose={()=>setIsAccountModal(false)}>
          <div className="space-y-8">
              <input autoFocus placeholder="Nombre de la cuenta" className="w-full bg-white/5 border border-white/10 py-6 px-6 rounded-3xl outline-none focus:border-accent transition-all text-white font-bold text-lg" value={accountForm.nombre} onChange={e=>setAccountForm({...accountForm, nombre: e.target.value})} />
              <div className="px-2">
                <UnifiedColorPalette 
                  selectedColor={accountForm.color} 
                  onSelect={(c) => setAccountForm({...accountForm, color: c})} 
                  savedColors={savedColors} 
                  onAddColor={handleAddColor} 
                  onRemoveColor={handleRemoveColor} 
                  sizeClass="w-12 h-12"
                />
              </div>
              <button onClick={handleSaveAccount} className="w-full bg-accent py-6 rounded-3xl text-white font-black uppercase tracking-widest text-[11px] shadow-2xl hover:brightness-110 active:scale-95 transition-all">Sincronizar Datos</button>
          </div>
      </Modal>}

      {isTxModal && <Modal title={txMode === 'create' ? 'Nuevo Movimiento' : 'Editar Movimiento'} onClose={()=>setIsTxModal(false)}>
          <div className="flex bg-white/5 p-1.5 rounded-3xl mb-8 border border-white/5">
            <button onClick={()=>setTxForm({...txForm, tipo:'ingreso'})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${txForm.tipo === 'ingreso' ? 'bg-[#10b981] text-white shadow-lg' : 'text-[#aab3cc] hover:text-white'}`}>Ingreso</button>
            <button onClick={()=>setTxForm({...txForm, tipo:'egreso'})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${txForm.tipo === 'egreso' ? 'bg-[#ef4444] text-white shadow-lg' : 'text-[#aab3cc] hover:text-white'}`}>Egreso</button>
          </div>
          <div className="space-y-6">
              <input placeholder="Concepto del registro" className="w-full bg-white/5 border border-white/10 py-6 px-6 rounded-3xl outline-none focus:border-accent transition-all text-white font-bold" value={txForm.titulo} onChange={e=>setTxForm({...txForm, titulo: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                  <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 font-black">{CURRENCY}</span><input type="number" placeholder="0.00" className="w-full bg-white/5 border border-white/10 pl-14 py-6 rounded-3xl font-black text-2xl outline-none text-white focus:border-accent" value={txForm.monto} onChange={e=>setTxForm({...txForm, monto: e.target.value})} /></div>
                  {txMode === 'edit' ? <input type="datetime-local" className="w-full bg-white/5 border border-white/10 py-6 px-6 rounded-3xl text-[11px] font-black uppercase text-white outline-none focus:border-accent" value={txForm.fecha} onChange={e=>setTxForm({...txForm, fecha: e.target.value})} /> : <div className="bg-white/5 border border-white/5 px-6 py-6 rounded-3xl flex items-center justify-center gap-3"><Clock size={16} className="text-accent"/><span className="text-[10px] font-black uppercase tracking-widest text-accent">Hora Auto</span></div>}
              </div>

              {availableGroups.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 pl-1">Categoría</p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setTxForm({...txForm, grupoId: ''})} 
                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all border ${!txForm.grupoId ? 'bg-white/15 text-white border-white/20 shadow-md' : 'bg-white/5 text-white/30 border-transparent hover:bg-white/8'}`}
                    >
                      Sin categoría
                    </button>
                    {availableGroups.map(g => (
                      <button 
                        key={g.id} 
                        onClick={() => setTxForm({...txForm, grupoId: g.id})}
                        className="px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border"
                        style={{
                          backgroundColor: String(txForm.grupoId) === String(g.id) ? `${g.color}25` : 'rgba(255,255,255,0.03)',
                          color: String(txForm.grupoId) === String(g.id) ? g.color : 'rgba(255,255,255,0.3)',
                          borderColor: String(txForm.grupoId) === String(g.id) ? `${g.color}50` : 'transparent',
                          boxShadow: String(txForm.grupoId) === String(g.id) ? `0 4px 12px ${g.color}20` : 'none'
                        }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }}></span>
                        {g.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea placeholder="Comentario opcional..." className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none focus:border-accent transition-all text-white font-medium text-sm h-28 resize-none" value={txForm.comentario} onChange={e=>setTxForm({...txForm, comentario: e.target.value})} />
              
              {!selectedAccountId && txMode === 'create' && <select className="w-full bg-white/5 border border-white/10 py-6 px-7 rounded-3xl text-[11px] font-black uppercase text-white outline-none appearance-none cursor-pointer focus:border-accent" value={txForm.cuentaId} onChange={e=>setTxForm({...txForm, cuentaId: e.target.value, grupoId: ''})}>
                  <option value="" className="bg-[#1a1f2e]">--- SELECCIONAR BILLETERA ---</option>
                  {cuentas.map(b => <option key={b.id} value={b.id} className="bg-[#1a1f2e]">{b.nombre}</option>)}
              </select>}
              
              <button onClick={handleSaveTx} className={`w-full py-7 font-black uppercase tracking-[0.3em] text-[10px] rounded-[35px] text-white shadow-2xl transition-all active:scale-95 ${txForm.tipo === 'ingreso' ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}>{txMode === 'create' ? 'Registrar en App' : 'Actualizar Movimiento'}</button>
          </div>
      </Modal>}

      {isManualModal && <Modal title="Arqueo (Fondo Real)" onClose={()=>setIsManualModal(false)}>
          <div className="space-y-7">
              <input autoFocus placeholder="Nombre (Yape, Bin, Cash...)" className="w-full bg-white/5 border border-white/10 py-6 px-6 rounded-3xl outline-none focus:border-accent transition-all text-white font-black uppercase text-xs tracking-widest" value={manualForm.nombre} onChange={e=>setManualForm({...manualForm, nombre: e.target.value})} />
              <div className="relative border-b-2 border-accent shadow-lg"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 font-black">{CURRENCY}</span><input type="number" placeholder="0.00" className="bg-transparent w-full pl-14 py-8 font-black text-4xl outline-none text-white text-center" value={manualForm.monto} onChange={e=>setManualForm({...manualForm, monto: e.target.value})} /></div>
              <button onClick={handleSaveManual} className="w-full bg-accent py-7 rounded-[35px] text-white font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl active:scale-95 transition-all">Guardar Saldo Final</button>
          </div>
      </Modal>}

      {isNoteModal && <Modal title={noteForm.id ? "Editar Anotación" : "Nueva Anotación"} onClose={()=>setIsNoteModal(false)}>
          <textarea autoFocus className="w-full bg-white/5 border border-white/10 h-64 p-8 rounded-[35px] outline-none focus:border-warning/50 text-white font-medium text-lg leading-relaxed shadow-inner" placeholder="Escribe tu nota aquí..." value={noteForm.contenido} onChange={e=>setNoteForm({...noteForm, contenido: e.target.value})} />
          <div className="mt-6">
            <UnifiedColorPalette 
              selectedColor={noteForm.color} 
              onSelect={(c) => setNoteForm({...noteForm, color: c})} 
              savedColors={savedColors} 
              onAddColor={handleAddColor} 
              onRemoveColor={handleRemoveColor} 
              sizeClass="w-10 h-10"
            />
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={()=>setIsNoteModal(false)} className="flex-1 bg-white/5 py-6 rounded-3xl uppercase text-[10px] font-black text-white/40 hover:bg-white/10 transition-all shadow-inner">Cancelar</button>
            <button onClick={handleSaveNote} className="flex-1 bg-accent py-6 rounded-3xl uppercase text-[10px] font-black text-white shadow-xl active:scale-95 transition-all">Guardar</button>
          </div>
      </Modal>}

      {isExportModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1a1f2e] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Exportar Excel</h3>
              <button onClick={()=>setShowExportModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><X size={24} className="text-white"/></button>
            </div>
            <p className="text-sm text-white/60 mb-6">Selecciona qué cuenta u hoja de reporte deseas exportar a Excel.</p>
            <select className="w-full bg-white/5 border border-white/10 py-5 px-6 rounded-2xl mb-6 text-[11px] font-black uppercase text-white outline-none appearance-none cursor-pointer focus:border-accent" value={exportAccountId} onChange={e=>setExportAccountId(e.target.value)}>
                <option value="all" className="bg-[#1a1f2e]"> TODAS LAS BILLETERAS </option>
                {cuentas.map(b => <option key={b.id} value={b.id} className="bg-[#1a1f2e]">{b.nombre}</option>)}
            </select>
            <div className="space-y-3">
              <button onClick={()=>{exportAllToExcel(exportAccountId === 'all' ? null : exportAccountId); setShowExportModal(false)}} className="w-full py-5 px-6 bg-accent hover:brightness-110 rounded-2xl flex items-center justify-center gap-3 transition-all">
                <Download size={20} className="text-white" />
                <span className="font-bold text-white">Descargar Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
