import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  PlusCircle, Trash2, Edit3, ArrowUpCircle, ArrowDownCircle,
  X, Wallet, PieChart, Home, ChevronRight,
  Download, StickyNote, ChevronUp, ChevronDown,
  TrendingUp, TrendingDown, Layers, FolderPlus, Tag, Settings, Clock, Calendar,
  Eye, EyeOff, ShieldCheck, Target, BarChart3, Calculator, ArrowLeftRight, Filter, AlertCircle, CheckCircle,
  GripVertical, LayoutGrid, ArrowDownAZ, ArrowDown01, RefreshCw, Palette,
  Lock, Unlock, Bell, Repeat, GraduationCap
} from 'lucide-react'
import * as XLSX from 'xlsx'
// API URL: uses proxy in dev and env in prod
const API = import.meta.env.VITE_API_URL || '/api';
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
    <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between cursor-pointer hover:bg-white/5 transition-colors gap-3" onClick={onToggle}>
      <div className="flex items-center justify-between w-full xl:w-auto">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#aab3cc] flex items-center gap-3 truncate pr-2">
          {Icon && <Icon size={18} className="text-accent flex-shrink-0" />} <span className="truncate">{title}</span>
        </h3>
        <ChevronDown size={20} className={`xl:hidden text-text-muted transition-transform duration-300 ${open ? 'rotate-180 text-accent' : ''}`} />
      </div>
      <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-start xl:justify-end" onClick={e => e.stopPropagation()}>
        {actions}
        <ChevronDown size={20} className={`hidden xl:block text-text-muted transition-transform duration-300 ${open ? 'rotate-180 text-accent' : ''}`} />
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

// --- DRAGGABLE ROW COMPONENT (desktop drag + mobile touch handle) ---
const DraggableRow = ({ tx, onEdit, onDelete, onToggleActivo, incognito, formatDate, onDragStart, onDragOver, onDrop, onMoveUp, onMoveDown, isDragging, isFirst, isLast, onViewNote, lockOrder, isCerrada }) => {
    const f = formatDate(tx.fecha)
    const catColor = tx.grupo?.color
    const isActivo = tx.activo !== false
    const canMove = isActivo && !lockOrder
    const touchY = useRef(null)
    const [isSwiping, setIsSwiping] = useState(false)
    const [dragEnabled, setDragEnabled] = useState(false)

    // Mobile: touch on grip handle to move up/down
    const handleGripTouch = (e) => {
        e.stopPropagation()
        touchY.current = e.touches[0].clientY
        setIsSwiping(true)
    }
    const handleGripMove = (e) => {
        if (!isSwiping || touchY.current === null) return
        const dy = e.touches[0].clientY - touchY.current
        if (Math.abs(dy) > 40) {
            if (dy < 0 && !isFirst) onMoveUp?.(tx.id)
            if (dy > 0 && !isLast) onMoveDown?.(tx.id)
            touchY.current = e.touches[0].clientY
        }
    }
    const handleGripEnd = () => { setIsSwiping(false); touchY.current = null }
    
    return (
        <div 
            draggable={canMove && dragEnabled}
            data-txid={tx.id}
            onDragStart={(e) => onDragStart(e, tx.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, tx.id)}
            className={`flex flex-wrap sm:flex-nowrap items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all gap-3 ${(canMove && dragEnabled) ? 'sm:cursor-grab sm:active:cursor-grabbing hover:border-white/10' : (isActivo ? 'hover:border-white/10' : 'cursor-not-allowed opacity-50')} ${isDragging || isSwiping ? 'opacity-60 scale-[0.98] ring-2 ring-accent/50' : ''}`}
            style={{ 
                backgroundColor: isActivo ? (catColor ? `${catColor}12` : 'rgba(255,255,255,0.03)') : 'rgba(0,0,0,0.3)',
                borderColor: isActivo ? (catColor ? `${catColor}25` : 'transparent') : 'rgba(255,255,255,0.1)',
                borderLeftWidth: isActivo ? (catColor ? '4px' : '1px') : '4px',
                borderLeftColor: isActivo ? (catColor || 'transparent') : '#64748b'
            }}
        >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {isActivo && !lockOrder && (
                    <div 
                        className={`flex-shrink-0 p-1.5 rounded-xl transition-all select-none ${canMove ? 'bg-white/5 active:bg-accent/20 cursor-grab active:cursor-grabbing' : 'opacity-20 cursor-default'}`}
                        style={{ touchAction: canMove ? 'none' : 'auto' }}
                        onMouseEnter={() => setDragEnabled(true)}
                        onMouseLeave={() => setDragEnabled(false)}
                        onTouchStart={canMove ? handleGripTouch : undefined}
                        onTouchMove={canMove ? handleGripMove : undefined}
                        onTouchEnd={canMove ? handleGripEnd : undefined}
                    >
                        <GripVertical size={16} className={`${isSwiping ? 'text-accent' : 'text-white/25'}`} />
                    </div>
                )}
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
                    <button onClick={() => onViewNote?.({ titulo: tx.titulo, comentario: tx.comentario, tipo: tx.tipo, grupo: tx.grupo, fecha: tx.fecha })} className="p-1.5 sm:p-2 bg-amber-400/10 text-amber-400/60 hover:text-amber-400 hover:bg-amber-400/20 rounded-xl transition-all" title="Ver nota">
                        <StickyNote size={14} />
                    </button>
                )}
                {!isCerrada && (
                    <button 
                        onClick={() => onToggleActivo(tx.id, !isActivo)} 
                        className={`p-1.5 sm:p-2 rounded-xl transition-all ${isActivo ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 text-white/30 hover:bg-white/20'}`}
                        title={isActivo ? 'Desactivar' : 'Activar'}
                    >
                        {isActivo ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    </button>
                )}
                <Amount val={tx.monto} incognito={incognito} className={`text-base sm:text-lg font-black ${isActivo ? (tx.tipo === 'ingreso' ? 'text-[#10b981]' : 'text-[#ef4444]') : 'text-white/30'}`} />
                {!isCerrada && (
                    <div className="flex gap-1">
                        <button onClick={()=>onEdit(tx)} className="p-1.5 sm:p-2 bg-white/5 text-white/40 hover:text-white rounded-xl transition-all"><Edit3 size={14} /></button>
                        <button onClick={()=>onDelete(tx.id)} className="p-1.5 sm:p-2 bg-white/5 text-white/40 hover:text-[#ef4444] rounded-xl transition-all"><Trash2 size={14} /></button>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- MOCK DATA (preview local — se reemplaza al presionar Actualizar) ---
const MOCK_NOTAS = [
  {
    codigo: 'ISIA 107', nombre: 'Infraestructura como Código', horas: '3', cal_disponible: true,
    componentes: [
      { name: 'ATTRGRD-ASISTENCIA', weight: '', score: '0', mustPass: 'Sí', inclusionIndicator: 'Final', nested: false },
      { name: '1_EP1-EVALUACION DE PROCESO 1', weight: '20', score: '15.5', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '1_SUB-SUBCOMPONENTE 1', weight: '30', score: '16', mustPass: 'No', inclusionIndicator: '', nested: true },
      { name: '2_SUB-SUBCOMPONENTE 2', weight: '30', score: '15', mustPass: 'No', inclusionIndicator: '', nested: true },
      { name: '3_SUB-SUBCOMPONENTE 3', weight: '40', score: '15.5', mustPass: 'No', inclusionIndicator: '', nested: true },
      { name: '2_EVP-EVALUACION PARCIAL', weight: '30', score: '14', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '3_EP2-EVALUACION DE PROCESO 2', weight: '20', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '4_SUB-SUBCOMPONENTE 4', weight: '30', score: '', mustPass: 'No', inclusionIndicator: '', nested: true },
      { name: '5_SUB-SUBCOMPONENTE 5', weight: '30', score: '', mustPass: 'No', inclusionIndicator: '', nested: true },
      { name: '6_SUB-SUBCOMPONENTE 6', weight: '40', score: '', mustPass: 'No', inclusionIndicator: '', nested: true },
      { name: '4_EVF-EVALUACION FINAL', weight: '30', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
    ]
  },
  {
    codigo: 'ISIA 118', nombre: 'Gobierno de Datos', horas: '3', cal_disponible: true,
    componentes: [
      { name: '1_EP1-EVALUACION DE PROCESO 1', weight: '20', score: '13', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '2_EVP-EVALUACION PARCIAL', weight: '30', score: '12.5', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '3_EP2-EVALUACION DE PROCESO 2', weight: '20', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '4_EVF-EVALUACION FINAL', weight: '30', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
    ]
  },
  {
    codigo: 'ISIA 127', nombre: 'Aplic. Móviles para Negocios', horas: '3', cal_disponible: true,
    componentes: [
      { name: '1_EP1-EVALUACION DE PROCESO 1', weight: '20', score: '16', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '2_EVP-EVALUACION PARCIAL', weight: '30', score: '17', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '3_EP2-EVALUACION DE PROCESO 2', weight: '20', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '4_EVF-EVALUACION FINAL', weight: '30', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
    ]
  },
  {
    codigo: 'ISIA 104', nombre: 'Cómputo Distribuido y Paralelo', horas: '3', cal_disponible: true,
    componentes: [
      { name: '1_EP1-EVALUACION DE PROCESO 1', weight: '20', score: '11', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '2_EVP-EVALUACION PARCIAL', weight: '30', score: '10', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '3_EP2-EVALUACION DE PROCESO 2', weight: '20', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '4_EVF-EVALUACION FINAL', weight: '30', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
    ]
  },
  {
    codigo: 'ICSI 676', nombre: 'Métodos Cuantitativos para Negocios', horas: '3', cal_disponible: true,
    componentes: [
      { name: '1_EP1-EVALUACION DE PROCESO 1', weight: '20', score: '14', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '2_EVP-EVALUACION PARCIAL', weight: '30', score: '13.5', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '3_EP2-EVALUACION DE PROCESO 2', weight: '20', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
      { name: '4_EVF-EVALUACION FINAL', weight: '30', score: '', mustPass: 'No', inclusionIndicator: 'Final', nested: false },
    ]
  },
  {
    codigo: 'ISIA 117', nombre: 'Proyecto de Investigación', horas: '3', cal_disponible: false,
    componentes: []
  },
]

const SCRAPE_STEPS = [
  { icon: '🔌', label: 'Conectando al servidor' },
  { icon: '🔑', label: 'Iniciando sesión en UPAO' },
  { icon: '🏫', label: 'Accediendo al campus virtual' },
  { icon: '📚', label: 'Buscando tus cursos' },
  { icon: '📊', label: 'Descargando calificaciones' },
  { icon: '💾', label: 'Guardando datos' },
]
// ms desde el inicio en que cada paso se activa (~37s total real)
const SCRAPE_STEP_TIMES = [0, 5000, 14000, 19000, 24000, 34000]
const SCRAPE_EXPECTED_SECS = 40

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
  const [lockOrder, setLockOrder] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [importAccountOpen, setImportAccountOpen] = useState(null)

  const [uiState, setUiState] = useState({ homeStats: true, homeNotes: true, homePagos: true, accStats: true, accAudit: true, accHistory: true, accCategories: false, accPagos: false })

  // Modals
  const [isAccountModal, setIsAccountModal] = useState(false)
  const [accountForm, setAccountForm] = useState({ nombre: '', color: '#3b82f6', id: "" })
  
  const [isTxModal, setIsTxModal] = useState(false)
  const [txMode, setTxMode] = useState('create')
  const [txForm, setTxForm] = useState({ titulo: '', monto: '', tipo: 'ingreso', comentario: '', fecha: '', cuentaId: '', id: '', grupoId: '' })
  const originalFechaRef = useRef('')

  const [isManualModal, setIsManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({ nombre: '', monto: '' })

  const [isNoteModal, setIsNoteModal] = useState(false)
  const [noteForm, setNoteForm] = useState({ id: null, contenido: '', color: '#fcd34d' })

  // View-note modal (read-only, from Historial)
  const [viewNoteModal, setViewNoteModal] = useState(false)
  const [viewNoteData, setViewNoteData] = useState(null)
  const handleViewNote = (data) => { setViewNoteData(data); setViewNoteModal(true) }

  const [isExportModal, setShowExportModal] = useState(false)
  const [exportAccountId, setExportAccountId] = useState("all")

  const [isPagoModal, setIsPagoModal] = useState(false)
  const [pagoMode, setPagoMode] = useState('create')
  const [pagoForm, setPagoForm] = useState({ id: '', nombre: '', monto: '', diaPago: '', comentario: '', cuentaId: '', grupoId: '' })

  // Notas UPAO
  const [notasUpao, setNotasUpao] = useState({ cursos: MOCK_NOTAS, updatedAt: new Date().toISOString() })
  const [upaoLoading, setUpaoLoading] = useState(false)
  const [upaoStep, setUpaoStep] = useState(0)
  const [upaoElapsed, setUpaoElapsed] = useState(0)
  const upaoStartRef = useRef(null)
  const [upaoError, setUpaoError] = useState(null)
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [simGrades, setSimGrades] = useState({})
  const [upaoProfiles, setUpaoProfiles] = useState(() => {
    try {
      const s = localStorage.getItem('upao_profiles')
      return s ? JSON.parse(s) : [{ id: '000280169', nombre: 'Yo', usuario: '000280169', password: '' }]
    } catch { return [{ id: '000280169', nombre: 'Yo', usuario: '000280169', password: '' }] }
  })
  const [activeProfileId, setActiveProfileId] = useState(
    () => localStorage.getItem('upao_active_profile') || '000280169'
  )
  const [showAddProfile, setShowAddProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ nombre: '', usuario: '', password: '' })

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

  const cargarNotasUpao = useCallback(async (profileId) => {
    try {
      const pid = profileId || activeProfileId
      const profile = upaoProfiles.find(p => p.id === pid)
      const user = profile?.usuario || pid
      const resp = await fetch(`${API}/notas-upao?user=${encodeURIComponent(user)}`)
      if (resp.ok) {
        const data = await resp.json()
        if (data.cursos && data.cursos.length > 0) setNotasUpao(data)
        else setNotasUpao({ cursos: [], updatedAt: null })
      }
    } catch (e) { console.error('Error cargando notas UPAO') }
  }, [activeProfileId, upaoProfiles])

  const handleRefreshNotas = async () => {
    setUpaoLoading(true)
    setUpaoError(null)
    try {
      const profile = upaoProfiles.find(p => p.id === activeProfileId)
      const body = {}
      if (profile?.usuario)  body.username = profile.usuario
      if (profile?.password) body.password = profile.password
      const resp = await fetch(`${API}/notas-upao/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (resp.ok) {
        const data = await resp.json()
        setNotasUpao({ cursos: data.cursos, updatedAt: data.updatedAt })
      } else {
        const err = await resp.json()
        setUpaoError(err.error || 'Error al actualizar notas')
      }
    } catch (e) {
      setUpaoError('No se pudo conectar al servidor')
    } finally {
      setSimGrades({})
      setUpaoLoading(false)
    }
  }

  const saveProfiles = (profiles) => {
    setUpaoProfiles(profiles)
    localStorage.setItem('upao_profiles', JSON.stringify(profiles))
  }

  const handleSwitchProfile = async (id) => {
    setActiveProfileId(id)
    localStorage.setItem('upao_active_profile', id)
    setSimGrades({})
    setNotasUpao({ cursos: [], updatedAt: null })
    await cargarNotasUpao(id)
  }

  const handleAddProfile = async () => {
    if (!profileForm.usuario.trim() || !profileForm.password.trim()) return
    const nombre = profileForm.nombre.trim() || profileForm.usuario.trim()
    const newP = { id: profileForm.usuario.trim(), nombre, usuario: profileForm.usuario.trim(), password: profileForm.password.trim() }
    const updated = [...upaoProfiles.filter(p => p.id !== newP.id), newP]
    saveProfiles(updated)
    setProfileForm({ nombre: '', usuario: '', password: '' })
    setShowAddProfile(false)
    await handleSwitchProfile(newP.id)
  }

  const handleDeleteProfile = (id) => {
    if (upaoProfiles.length <= 1) return
    const updated = upaoProfiles.filter(p => p.id !== id)
    saveProfiles(updated)
    if (activeProfileId === id) handleSwitchProfile(updated[0].id)
  }

  useEffect(() => {
    cargarCuentas(false)
    cargarNotas()
    cargarNotasUpao()
    const interval = setInterval(() => cargarCuentas(false), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!upaoLoading) {
      setUpaoStep(0)
      setUpaoElapsed(0)
      upaoStartRef.current = null
      return
    }
    upaoStartRef.current = Date.now()
    setUpaoStep(0)
    setUpaoElapsed(0)
    const timers = SCRAPE_STEP_TIMES.slice(1).map((t, i) =>
      setTimeout(() => setUpaoStep(i + 1), t)
    )
    const ticker = setInterval(() => {
      if (upaoStartRef.current) setUpaoElapsed(Math.floor((Date.now() - upaoStartRef.current) / 1000))
    }, 200)
    return () => { timers.forEach(clearTimeout); clearInterval(ticker) }
  }, [upaoLoading])

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

  // Move up/down (mobile) - swap with adjacent item
  const handleMoveItem = async (txId, direction) => {
    const cuenta = cuentas.find(c => c.id === selectedAccountId)
    if (!cuenta) return
    const txs = [...getSortedTransactions(cuenta.transacciones || [], sortMode)]
    const idx = txs.findIndex(t => t.id === txId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= txs.length) return
    ;[txs[idx], txs[swapIdx]] = [txs[swapIdx], txs[idx]]
    setCuentas(prev => prev.map(c => {
      if (c.id === selectedAccountId) return { ...c, transacciones: txs.map((t, i) => ({ ...t, orden: i })) }
      return c
    }))
    const ordenes = txs.map((t, i) => ({ id: t.id, orden: i }))
    try {
      await fetch(`${API}/cuentas/${selectedAccountId}/transacciones/reorder`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenes })
      })
    } catch (e) { await cargarCuentas() }
  }

  // Lock/Unlock account
  const handleToggleLock = async (accountId, lock) => {
    if (lock && !confirm('¿Finalizar y bloquear esta cuenta? No podrás agregar movimientos hasta desbloquearla.')) return
    setCuentas(prev => prev.map(c => c.id === accountId ? { ...c, estado: lock ? 'cerrada' : 'activa', fechaCierre: lock ? new Date().toISOString() : null } : c))
    try {
      await fetch(`${API}/cuentas/${accountId}/lock`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: lock })
      })
      await cargarCuentas()
    } catch (e) { setSyncError('Error sincronizando'); await cargarCuentas() }
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
    const finalData = { titulo: txForm.titulo, monto: parseFloat(txForm.monto), tipo: txForm.tipo, comentario: txForm.comentario || '', fecha: txForm.fecha ? new Date(txForm.fecha).toISOString() : new Date().toISOString(), grupoId: txForm.grupoId || null }
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
    if (txMode === 'edit' && txForm.fecha && txForm.fecha !== originalFechaRef.current) setSortMode('date')
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
    const fechaLocal = new Date(tx.fecha).toISOString().slice(0, 16)
    originalFechaRef.current = fechaLocal
    setTxForm({ titulo: tx.titulo, monto: tx.monto, tipo: tx.tipo, comentario: tx.comentario || '', fecha: fechaLocal, cuentaId: tx.cuentaId, id: tx.id, grupoId: tx.grupoId || '' })
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

  const handleImportGroups = async (targetId, sourceId) => {
    if (!sourceId) return;
    const sourceAccount = cuentas.find(c => String(c.id) === String(sourceId));
    if (!sourceAccount || !sourceAccount.grupos || sourceAccount.grupos.length === 0) return alert('La cuenta no tiene categorías para importar.');
    
    const targetAccount = cuentas.find(c => String(c.id) === String(targetId));
    const targetNames = new Set((targetAccount.grupos || []).map(g => g.nombre.toLowerCase()));
    
    for (const g of sourceAccount.grupos) {
      if (!targetNames.has(g.nombre.toLowerCase())) {
         await fetch(`${API}/cuentas/${targetId}/grupos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: g.nombre, color: g.color }) });
      }
    }
    setImportAccountOpen(null);
    await cargarCuentas();
  }

  // --- PAGOS MENSUALES ---
  const handleSavePago = async () => {
    const cid = pagoForm.cuentaId || selectedAccountId
    if (!cid) return alert('Selecciona una cuenta')
    const data = { nombre: pagoForm.nombre, monto: pagoForm.monto, diaPago: pagoForm.diaPago, comentario: pagoForm.comentario || '', grupoId: pagoForm.grupoId || null }
    const url = pagoMode === 'create' ? `${API}/cuentas/${cid}/pagos-mensuales` : `${API}/pagos-mensuales/${pagoForm.id}`
    const method = pagoMode === 'create' ? 'POST' : 'PUT'
    setIsPagoModal(false)
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pagoMode === 'edit' ? { ...data, cuentaId: cid } : data) })
    await cargarCuentas()
  }

  const handleDeletePago = async (pagoId) => {
    if (!confirm('¿Eliminar este pago mensual?')) return
    await fetch(`${API}/pagos-mensuales/${pagoId}`, { method: 'DELETE' })
    await cargarCuentas()
  }

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  
  const getMesKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const getMesSiguiente = (mesKey) => {
    const [a, m] = mesKey.split('-').map(Number)
    return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`
  }
  const getMesNombre = (mesKey) => {
    if (!mesKey) return ''
    const [a, m] = mesKey.split('-').map(Number)
    return `${MESES[m - 1]} ${a}`
  }

  const handlePayPago = async (pago, targetCuentaId) => {
    const hoy = new Date()
    const mesActualKey = getMesKey(hoy)
    const yaPagadoEsteMes = pago.mesPagado === mesActualKey
    const mesObjetivo = yaPagadoEsteMes ? getMesSiguiente(mesActualKey) : mesActualKey
    const mesNombre = getMesNombre(mesObjetivo)
    
    if (!confirm(`¿Registrar pago de ${CURRENCY}${pago.monto} por "${pago.nombre}" para ${mesNombre}?`)) return
    await fetch(`${API}/pagos-mensuales/${pago.id}/pagar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuentaId: targetCuentaId || pago.cuentaId, mesObjetivo })
    })
    await cargarCuentas()
  }

  const handlePayCurrentMonth = async (pago, targetCuentaId) => {
    const mesActualKey = getMesKey(new Date())
    const mesNombre = getMesNombre(mesActualKey)
    const yaPagado = pago.mesPagado === mesActualKey
    const msg = yaPagado
      ? `⚠️ "${pago.nombre}" ya fue pagado en ${mesNombre}. ¿Registrar un pago adicional de ${CURRENCY}${pago.monto}?`
      : `¿Registrar pago de ${CURRENCY}${pago.monto} por "${pago.nombre}" para ${mesNombre}?`
    if (!confirm(msg)) return
    await fetch(`${API}/pagos-mensuales/${pago.id}/pagar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuentaId: targetCuentaId || pago.cuentaId, mesObjetivo: mesActualKey })
    })
    await cargarCuentas()
  }

  const handleEditPago = (pago) => {
    setPagoMode('edit')
    setPagoForm({ id: pago.id, nombre: pago.nombre, monto: pago.monto, diaPago: pago.diaPago, comentario: pago.comentario || '', cuentaId: pago.cuentaId, grupoId: pago.grupoId || '' })
    setIsPagoModal(true)
  }

  // Get upcoming/overdue monthly payments for notifications
  const pagosProximos = useMemo(() => {
    const hoy = new Date()
    const diaHoy = hoy.getDate()
    const mesActualKey = getMesKey(hoy)
    const allPagos = []
    cuentas.forEach(c => {
      (c.pagosMensuales || []).filter(p => p.activo).forEach(p => {
        const yaPagadoEsteMes = p.mesPagado === mesActualKey
        const diasParaPago = p.diaPago >= diaHoy ? p.diaPago - diaHoy : 0
        const esProximo = diasParaPago <= 5 && diasParaPago >= 0
        const esVencido = p.diaPago < diaHoy && !yaPagadoEsteMes
        const mesObjetivo = yaPagadoEsteMes ? getMesSiguiente(mesActualKey) : mesActualKey
        if (!yaPagadoEsteMes && (esProximo || esVencido)) {
          allPagos.push({ ...p, cuentaNombre: c.nombre, cuentaColor: c.color, esVencido, diasParaPago, mesObjetivo })
        }
      })
    })
    return allPagos.sort((a, b) => a.diaPago - b.diaPago)
  }, [cuentas])

  // --- EXCEL EXPORT (server-side premium report) ---
  const exportAllToExcel = async (targetAccountId = null) => {
    try {
      const url = targetAccountId ? `${API}/export/excel?accountId=${targetAccountId}` : `${API}/export/excel`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error('Error descargando')
      const blob = await resp.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'Reporte_FinControl.xlsx'
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      console.error('Export error:', e)
      alert('Error al generar el reporte. Intenta de nuevo.')
    }
  }

  const handleExportWithPrompt = () => {
    setShowExportModal(true)
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

      {/* ── PAGOS MENSUALES ── */}
      <section className="px-2">
        <div className="flex justify-between items-center mb-4 mt-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#aab3cc] flex items-center gap-2"><Repeat size={14} className="text-purple-400" /> Pagos Mensuales</h3>
        </div>

        {pagosProximos.length > 0 && (
          <div className="space-y-3 mb-4">
            {pagosProximos.map(p => (
              <div key={p.id} className={`p-5 rounded-[28px] border ${p.esVencido ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'} animate-slide-down`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-2xl flex-shrink-0 ${p.esVencido ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                    <Bell size={18} className={p.esVencido ? 'text-red-400' : 'text-yellow-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${p.esVencido ? 'text-red-400' : 'text-yellow-400'}`}>
                      {p.esVencido ? '⚠️ PAGO VENCIDO' : `📅 Paga en ${p.diasParaPago} día${p.diasParaPago !== 1 ? 's' : ''}`}
                    </p>
                    <p className="text-sm font-bold text-white/90 mt-1">{p.nombre}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] font-black text-white/30 uppercase">Día {p.diaPago} · {p.cuentaNombre}</span>
                      <Amount val={p.monto} incognito={incognito} className="text-sm font-black text-[#ef4444]" />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handlePayPago(p)} className={`px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${p.esVencido ? 'bg-red-500 text-white shadow-lg' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}>
                      Pagar {getMesNombre(p.mesObjetivo).split(' ')[0]}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All monthly payments list */}
        <Accordion title={`Todos los Pagos (${cuentas.reduce((s, c) => s + (c.pagosMensuales || []).length, 0)})`} icon={Repeat} open={uiState.homePagos} onToggle={() => setUiState(s => ({...s, homePagos: !s.homePagos}))}>
          <div className="space-y-2 mt-2">
            {cuentas.flatMap(c => (c.pagosMensuales || []).map(p => ({ ...p, cuentaNombre: c.nombre, cuentaColor: c.color }))).length === 0 && (
              <p className="text-[10px] text-white/20 italic text-center py-4">No hay pagos mensuales configurados.</p>
            )}
            {cuentas.flatMap(c => (c.pagosMensuales || []).map(p => ({ ...p, cuentaNombre: c.nombre, cuentaColor: c.color }))).map(p => {
              const mesActualKey = getMesKey(new Date())
              const yaPagado = p.mesPagado === mesActualKey
              const mesSigKey = getMesSiguiente(mesActualKey)
              return (
                <div key={p.id} className={`flex flex-wrap sm:flex-nowrap items-center justify-between p-4 rounded-2xl border transition-all gap-2 ${yaPagado ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-white/3'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.cuentaColor }}></div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${p.activo ? 'text-white/90' : 'text-white/30 line-through'}`}>{p.nombre}</p>
                      <p className="text-[8px] font-black text-white/20 uppercase">
                        Día {p.diaPago} · {p.cuentaNombre}
                        {p.mesPagado ? ` · ✅ Pagado ${getMesNombre(p.mesPagado)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Amount val={p.monto} incognito={incognito} className="text-sm font-black text-[#ef4444]" />
                    <button onClick={() => handleEditPago(p)} className="p-1.5 bg-white/5 text-white/30 hover:text-white rounded-lg transition-all"><Edit3 size={12} /></button>
                    {p.activo && (
                      <>
                        <button onClick={() => handlePayCurrentMonth(p)} className="px-3 py-1.5 bg-green-500/20 text-green-400 text-[9px] font-black uppercase rounded-lg hover:bg-green-500/30 transition-all">
                          Pagar este mes
                        </button>
                        <button onClick={() => handlePayPago(p)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase rounded-lg hover:bg-purple-500/30 transition-all">
                          {yaPagado ? `Pagar ${getMesNombre(mesSigKey).split(' ')[0]}` : `Pagar ${getMesNombre(mesActualKey).split(' ')[0]}`}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Accordion>
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
          const isCerrada = c.estado === 'cerrada'
          
          return (
            <div key={c.id} className={`rounded-[40px] border transition-all duration-300 ${isCerrada ? 'border-yellow-500/30 bg-[#1a1a10]' : ''} ${isSelected ? 'border-accent bg-[#1a1f2e] shadow-2xl mt-4 mb-8 scale-[1.01]' : !isCerrada ? 'border-white/5 bg-[#141824] hover:bg-[#1a1f2e] shadow-md' : ''}`}>
              <div className="p-8 flex items-center justify-between cursor-pointer" onClick={() => handleSelectAccount(c.id)}>
                <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg border text-white ${isCerrada ? 'border-yellow-500/30 opacity-60' : 'border-white/10'}`} style={{ backgroundColor: c.color }}><Wallet size={30} /></div>
                      {isCerrada && <div className="absolute -bottom-1 -right-1 bg-yellow-500 p-1.5 rounded-full shadow-lg"><Lock size={12} className="text-black" /></div>}
                    </div>
                    <div>
                        <h3 className={`font-black text-2xl tracking-tighter ${isCerrada ? 'text-white/50' : 'text-white'}`}>{c.nombre}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Amount val={sm.net} incognito={incognito} className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest bg-white/5 ${sm.net >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`} />
                          {isCerrada && (
                            <span className="text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest bg-yellow-500/15 text-yellow-400 flex items-center gap-1.5">
                              <Lock size={9} /> Cerrada {c.fechaCierre ? `· ${new Date(c.fechaCierre).toLocaleDateString()}` : ''}
                            </span>
                          )}
                        </div>
                    </div>
                </div>
                <ChevronDown size={28} className={`text-text-muted transition-transform duration-500 ${isSelected ? 'rotate-180 text-accent' : ''}`} />
              </div>

              {isSelected && (
                <div className="px-4 sm:px-8 pb-8 space-y-4">
                  {isCerrada && (
                    <div className="flex items-center gap-3 p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl animate-slide-down">
                      <Lock size={20} className="text-yellow-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[11px] font-black text-yellow-400 uppercase">Cuenta Finalizada</p>
                        <p className="text-[10px] text-yellow-400/60 mt-0.5">Cerrada el {c.fechaCierre ? new Date(c.fechaCierre).toLocaleString() : 'fecha desconocida'}. No se pueden agregar movimientos.</p>
                      </div>
                      <button onClick={() => handleToggleLock(c.id, false)} className="px-4 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-1.5 flex-shrink-0">
                        <Unlock size={12} /> Desbloquear
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 p-3 bg-white/5 rounded-3xl mb-6">
                    {!isCerrada ? (
                      <>
                        <div className="flex gap-3">
                            <button onClick={() => { setTxMode('create'); setTxForm({titulo:'', monto:'', tipo:'egreso', comentario: '', cuentaId: c.id, grupoId: ''}); setIsTxModal(true) }} className="flex-1 py-4 bg-[#ef4444] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"><ArrowDownCircle size={18}/> Salida</button>
                            <button onClick={() => { setTxMode('create'); setTxForm({titulo:'', monto:'', tipo:'ingreso', comentario: '', cuentaId: c.id, grupoId: ''}); setIsTxModal(true) }} className="flex-1 py-4 bg-[#10b981] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"><ArrowUpCircle size={18}/> Entrada</button>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsManualModal(true)} className="flex-1 py-3 bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-accent/20 transition-all"><Calculator size={16} className="inline mr-2"/> Saldo Físico</button>
                            <button onClick={() => handleToggleLock(c.id, true)} className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500/60 hover:text-yellow-500 hover:bg-yellow-500/20 px-5 transition-all" title="Finalizar cuenta"><Lock size={20}/></button>
                            <button onClick={() => handleDeleteAccount(c.id)} className="p-3 bg-white/5 rounded-2xl text-danger/40 hover:text-danger hover:bg-danger/10 px-5 transition-all"><Trash2 size={20}/></button>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-3">
                        <button onClick={() => handleToggleLock(c.id, false)} className="flex-1 py-4 bg-yellow-500/15 border border-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-500/25 transition-all"><Unlock size={18}/> Desbloquear Cuenta</button>
                        <button onClick={() => handleDeleteAccount(c.id)} className="p-3 bg-white/5 rounded-2xl text-danger/40 hover:text-danger hover:bg-danger/10 px-6 transition-all"><Trash2 size={20}/></button>
                      </div>
                    )}
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
                            {!isCerrada && <button onClick={() => handleDeleteCategory(g.id)} className="ml-1 opacity-30 hover:opacity-100 transition-opacity"><X size={12} style={{ color: g.color }}/></button>}
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
                      ) : importAccountOpen === c.id ? (
                        <div className="bg-white/5 p-5 rounded-2xl space-y-4 animate-slide-down border border-white/5">
                           <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Selecciona la cuenta de origen</p>
                           <select 
                               className="w-full bg-[#141824] border border-white/10 py-3.5 px-5 rounded-2xl text-white font-bold text-sm outline-none transition-all"
                               onChange={(e) => handleImportGroups(c.id, e.target.value)}
                               defaultValue=""
                           >
                               <option value="" disabled>-- Seleccionar Cuenta --</option>
                               {cuentas.filter(other => other.id !== c.id).map(other => (
                                   <option key={other.id} value={other.id}>{other.nombre}</option>
                               ))}
                           </select>
                           <button onClick={() => setImportAccountOpen(null)} className="w-full py-3.5 bg-white/5 rounded-2xl text-[10px] font-black text-white/40 hover:text-white/60 transition-all mt-2">Cancelar</button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button onClick={() => { setCatFormOpen(c.id); setCatForm({ nombre: '', color: '#3b82f6' }) }} className="flex-1 py-3.5 bg-white/5 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/30 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                            <PlusCircle size={14}/> Agregar
                          </button>
                          {cuentas.length > 1 && (
                              <button onClick={() => setImportAccountOpen(c.id)} className="flex-1 py-3.5 bg-accent/10 border border-dashed border-accent/20 rounded-2xl text-[10px] font-black uppercase text-accent/60 hover:text-accent hover:border-accent/40 transition-all flex items-center justify-center gap-2">
                                <ArrowDownCircle size={14}/> Importar
                              </button>
                          )}
                        </div>
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

                  {/* ── PAGOS MENSUALES ── */}
                  <Accordion title={`Pagos Mensuales (${(c.pagosMensuales || []).length})`} icon={Repeat} open={uiState.accPagos} onToggle={() => setUiState(s => ({...s, accPagos: !s.accPagos}))}
                    actions={!isCerrada && <button onClick={(e) => { e.stopPropagation(); setPagoMode('create'); setPagoForm({ id: '', nombre: '', monto: '', diaPago: '', comentario: '', cuentaId: c.id, grupoId: '' }); setIsPagoModal(true) }} className="p-1.5 bg-white/5 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-all"><PlusCircle size={14} /></button>}
                  >
                    <div className="space-y-2 mt-2">
                      {(c.pagosMensuales || []).length === 0 && <p className="text-[10px] text-white/20 italic text-center py-4">Sin pagos mensuales configurados.</p>}
                      {(c.pagosMensuales || []).map(p => {
                        const mesActualKey = getMesKey(new Date())
                        const yaPagado = p.mesPagado === mesActualKey
                        const mesSigKey = getMesSiguiente(mesActualKey)
                        return (
                          <div key={p.id} className={`flex flex-wrap sm:flex-nowrap items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all gap-2 ${yaPagado ? 'border-green-500/20 bg-green-500/5' : p.activo ? 'border-purple-500/15 bg-purple-500/5' : 'border-white/5 bg-white/3 opacity-50'}`}>
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Repeat size={14} className={`flex-shrink-0 ${yaPagado ? 'text-green-400' : 'text-purple-400'}`} />
                              <div className="min-w-0">
                                <p className={`text-sm font-bold ${p.activo ? 'text-white/90' : 'text-white/30 line-through'}`}>{p.nombre}</p>
                                <p className="text-[8px] font-black text-white/20 uppercase">
                                  Día {p.diaPago} de cada mes
                                  {p.mesPagado ? ` · ✅ Pagado ${getMesNombre(p.mesPagado)}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Amount val={p.monto} incognito={incognito} className="text-sm font-black text-[#ef4444]" />
                              <button onClick={() => handleEditPago(p)} className="p-1.5 bg-white/5 text-white/30 hover:text-white rounded-lg transition-all"><Edit3 size={12} /></button>
                              <button onClick={() => handleDeletePago(p.id)} className="p-1.5 bg-white/5 text-white/30 hover:text-[#ef4444] rounded-lg transition-all"><Trash2 size={12} /></button>
                              {p.activo && !isCerrada && (
                                <>
                                  <button onClick={() => handlePayCurrentMonth(p)} className="px-3 py-1.5 bg-green-500/20 text-green-400 text-[9px] font-black uppercase rounded-lg hover:bg-green-500/30 transition-all">
                                    Pagar este mes
                                  </button>
                                  <button onClick={() => handlePayPago(p)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase rounded-lg hover:bg-purple-500/30 transition-all">
                                    {yaPagado ? `Pagar ${getMesNombre(mesSigKey).split(' ')[0]}` : `Pagar ${getMesNombre(mesActualKey).split(' ')[0]}`}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Accordion>

                  {/* ── HISTORIAL WITH SPLIT MODE ── */}
                  <Accordion 
                    title="Historial de Operaciones" 
                    icon={FolderPlus} 
                    open={uiState.accHistory} 
                    onToggle={() => setUiState(s => ({...s, accHistory: !s.accHistory}))}
                    actions={
                      <div className="flex flex-wrap items-center justify-end gap-1.5 w-full">
                        <select 
                          className="bg-[#141824] border border-white/10 text-white/90 text-[9px] font-black uppercase rounded-lg px-2 py-1.5 outline-none cursor-pointer shadow-sm hover:bg-white/5 transition-all max-w-[120px] sm:max-w-none"
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="" className="bg-[#141824] text-white">TODAS</option>
                          {(c.grupos || []).map(g => <option key={g.id} value={g.nombre} className="bg-[#141824] text-white">{g.nombre}</option>)}
                        </select>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setLockOrder(!lockOrder); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[9px] font-black uppercase ${!lockOrder ? 'bg-accent text-white shadow-lg' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                          title={lockOrder ? 'Desbloquear Orden (Mover libremente)' : 'Bloquear Orden (Fijar elementos)'}
                        >
                          {!lockOrder ? <Unlock size={12} /> : <Lock size={12} />}
                          <span className="hidden sm:inline">{!lockOrder ? 'Mover Libre' : 'Bloqueado'}</span>
                        </button>
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
                        {getSortedTransactions(c.transacciones || [], sortMode).filter(tx => filterCategory ? tx.grupo?.nombre === filterCategory : true).map((tx, idx, arr) => (
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
                            onMoveUp={(id) => handleMoveItem(id, 'up')}
                            onMoveDown={(id) => handleMoveItem(id, 'down')}
                            isFirst={idx === 0}
                            isLast={idx === arr.length - 1}
                            isDragging={draggedId === tx.id}
                            onViewNote={handleViewNote}
                            lockOrder={lockOrder || sortMode !== 'custom'}
                            isCerrada={isCerrada}
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

  const NotasUpaoView = () => {
    const PASS  = 10.5
    const PARTS = [['EP1', 20], ['EVP', 30], ['EP2', 20], ['EVF', 30]]
    const activeProfile = upaoProfiles.find(p => p.id === activeProfileId) || upaoProfiles[0]

    const gradeColor = (val) => {
      const n = parseFloat(val)
      if (!val || isNaN(n)) return 'text-white/30'
      if (n >= 14)   return 'text-[#10b981]'
      if (n >= PASS) return 'text-yellow-400'
      return 'text-[#ef4444]'
    }

    // Real score from scraper (null if missing)
    // nested=true en datos reales significa "tiene botón expandir" (padre), no "es hijo"
    // Usamos inclusionIndicator==='' para identificar filas hijo (subcomponentes)
    const isSubComponent = (comp) => comp.inclusionIndicator === ''
    const realScore = (comps, kw) => {
      const c = (comps || []).find(c => c.name?.toUpperCase().includes(kw) && !isSubComponent(c))
      return (c && c.score !== '') ? parseFloat(c.score) || null : null
    }

    // Effective score: real first, then simulation
    const effScore = (comps, kw, cod) => {
      const r = realScore(comps, kw)
      if (r !== null) return { val: r, real: true }
      const s = simGrades[`${cod}-${kw}`]
      return { val: (s && s !== '') ? s : null, real: false }
    }

    // Projection + minimum needed
    const calcInfo = (comps, cod) => {
      let acum = 0, missingW = 0
      const missing = []
      for (const [kw, w] of PARTS) {
        const { val } = effScore(comps, kw, cod)
        if (val !== null) acum += parseFloat(val) * w / 100
        else { missingW += w; missing.push(kw) }
      }
      const needed  = PASS - acum
      const minEach = missingW > 0 ? needed / (missingW / 100) : null
      const maxPoss = acum + 20 * (missingW / 100)
      return { acum, missing, missingW, minEach, maxPoss,
        passing:     acum >= PASS,
        impossible:  missingW > 0 && maxPoss < PASS,
        allGraded:   missingW === 0 }
    }

    return (
      <div className="space-y-5 pb-40">

        {/* ── Header ── */}
        <div className="flex justify-between items-center px-2">
          <div>
            <h2 className="text-lg font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
              <GraduationCap size={20} className="text-accent" /> Notas UPAO
            </h2>
            {notasUpao.updatedAt && (
              <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1 pl-1">
                Actualizado: {new Date(notasUpao.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
          <button onClick={handleRefreshNotas} disabled={upaoLoading}
            className="flex items-center gap-2 px-5 py-3 bg-accent/10 border border-accent/30 rounded-2xl text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all disabled:opacity-50 active:scale-95">
            <RefreshCw size={16} className={upaoLoading ? 'animate-spin' : ''} />
            {upaoLoading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {/* ── Selector de perfiles ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {upaoProfiles.map(p => (
            <button key={p.id} onClick={() => handleSwitchProfile(p.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] font-black transition-all ${
                p.id === activeProfileId
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
              }`}>
              <span>{p.id === activeProfileId ? '😊' : '👤'}</span>
              <span>{p.nombre}</span>
              {upaoProfiles.length > 1 && p.id !== activeProfileId && (
                <button onClick={e => { e.stopPropagation(); handleDeleteProfile(p.id) }}
                  className="ml-1 opacity-40 hover:opacity-100 text-red-400 transition-opacity">
                  <X size={10} />
                </button>
              )}
            </button>
          ))}
          <button onClick={() => setShowAddProfile(v => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] font-black transition-all ${
              showAddProfile ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30 hover:bg-white/8 hover:text-white/60'
            }`}>
            <PlusCircle size={13} /> Agregar
          </button>
        </div>

        {/* ── Formulario agregar perfil ── */}
        {showAddProfile && (
          <div className="bg-[#1a1f2e] rounded-[24px] border border-white/10 p-5 space-y-3 animate-slide-down">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Nuevo perfil UPAO</p>
            <input placeholder="Nombre (opcional)" value={profileForm.nombre}
              onChange={e => setProfileForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 py-3 px-4 rounded-2xl text-white text-sm font-bold outline-none focus:border-accent transition-all" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="ID UPAO (ej: 000123456)" value={profileForm.usuario}
                onChange={e => setProfileForm(f => ({ ...f, usuario: e.target.value }))}
                className="bg-white/5 border border-white/10 py-3 px-4 rounded-2xl text-white text-sm font-bold outline-none focus:border-accent transition-all" />
              <input type="password" placeholder="Contraseña (NIP)" value={profileForm.password}
                onChange={e => setProfileForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAddProfile()}
                className="bg-white/5 border border-white/10 py-3 px-4 rounded-2xl text-white text-sm font-bold outline-none focus:border-accent transition-all" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowAddProfile(false); setProfileForm({ nombre: '', usuario: '', password: '' }) }}
                className="flex-1 py-3 bg-white/5 rounded-2xl text-[10px] font-black text-white/30 hover:text-white/60 transition-all">
                Cancelar
              </button>
              <button onClick={handleAddProfile}
                disabled={!profileForm.usuario.trim() || !profileForm.password.trim()}
                className="flex-1 py-3 bg-accent rounded-2xl text-[10px] font-black text-white shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-40">
                Guardar y cargar notas
              </button>
            </div>
          </div>
        )}

        {upaoError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-[11px] text-red-400 font-bold">{upaoError}</p>
          </div>
        )}

        {upaoLoading && (() => {
          const pct = Math.min(
            Math.max(
              Math.round((upaoElapsed / SCRAPE_EXPECTED_SECS) * 100),
              Math.round((upaoStep / (SCRAPE_STEPS.length - 1)) * 100)
            ), 98
          )
          const mins = Math.floor(upaoElapsed / 60)
          const secs = upaoElapsed % 60
          const timeStr = mins > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : `${secs}s`
          return (
          <div className="relative overflow-hidden rounded-[30px] border border-accent/20 bg-gradient-to-b from-[#1a1f2e] to-[#0d1117] p-5">
            {/* glow de fondo */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-accent/8 blur-3xl rounded-full" />

            {/* cabecera */}
            <div className="relative flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                <GraduationCap size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-white leading-tight">Cargando tus notas</p>
                <p className="text-[10px] text-white/30 font-bold">UPAO · Campus Virtual</p>
              </div>
              {/* contador de tiempo */}
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-[22px] font-black text-accent tabular-nums leading-none">{timeStr}</span>
                <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">transcurridos</span>
              </div>
            </div>

            {/* barra de progreso principal */}
            <div className="relative mb-4">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #6366f1, #3b82f6, #06b6d4)',
                    boxShadow: '0 0 12px rgba(99,102,241,0.5)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-white/30 font-black">{pct}%</span>
                <span className="text-[9px] text-white/20 font-bold">~{SCRAPE_EXPECTED_SECS}s total</span>
              </div>
            </div>

            {/* pasos */}
            <div className="relative space-y-1">
              {SCRAPE_STEPS.map((step, i) => {
                const done = i < upaoStep
                const current = i === upaoStep
                return (
                  <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-500 ${
                    current ? 'bg-accent/10 border border-accent/20' :
                    done    ? 'bg-emerald-500/5 border border-transparent' :
                              'border border-transparent opacity-20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 text-[10px] font-black ${
                      done    ? 'bg-emerald-500/25 text-emerald-400' :
                      current ? 'bg-accent/25' : 'bg-white/5'
                    }`}>
                      {done ? '✓' : current ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold transition-all duration-500 ${
                      done ? 'text-emerald-400' : current ? 'text-white' : 'text-white/25'
                    }`}>
                      {step.icon} {step.label}
                    </span>
                    {current && <span className="ml-auto text-[8px] text-accent/60 font-black animate-pulse">en curso</span>}
                    {done && <span className="ml-auto text-[8px] text-emerald-400/50 font-black">✓</span>}
                  </div>
                )
              })}
            </div>
          </div>
          )
        })()}

        {!upaoLoading && notasUpao.cursos.length === 0 && (
          <div className="p-10 bg-[#1a1f2e] rounded-[30px] border border-white/5 text-center">
            <GraduationCap size={44} className="mx-auto text-white/10 mb-4" />
            <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Sin datos aún</p>
            <p className="text-[10px] text-white/20 mt-2">Presiona "Actualizar" para cargar tus notas</p>
          </div>
        )}

        {/* ── Hint ── */}
        {notasUpao.cursos.length > 0 && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-accent/5 border border-dashed border-accent/20 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-accent/50 flex-shrink-0" />
            <p className="text-[9px] text-accent/60 font-bold leading-relaxed">
              Las celdas punteadas azules son editables — escribe una nota para simular tu promedio
            </p>
          </div>
        )}

        {/* ── Cards ── */}
        <div className="space-y-3">
          {(notasUpao.cursos || []).map((curso) => {
            const comps  = curso.componentes || []
            const info   = calcInfo(comps, curso.codigo)
            const isOpen = expandedCourse === curso.codigo

            return (
              <div key={curso.codigo} className="bg-[#141824] rounded-[28px] border border-white/5 overflow-hidden">

                {/* ── Card top (clickable) ── */}
                <div className="p-5 pb-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedCourse(isOpen ? null : curso.codigo)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-1 rounded-lg">
                          {curso.codigo}
                        </span>
                        {!curso.cal_disponible && (
                          <span className="text-[8px] font-black uppercase text-white/25 bg-white/5 px-2 py-1 rounded-lg">Sin notas</span>
                        )}
                        {info.allGraded && (
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${info.passing ? 'text-[#10b981] bg-[#10b981]/10' : 'text-[#ef4444] bg-[#ef4444]/10'}`}>
                            {info.passing ? '😊 Aprobado' : '😔 Desaprobado'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-white/90 leading-snug">{curso.nombre}</p>
                      <p className="text-[9px] text-white/25 mt-0.5">{curso.horas} créditos</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      {info.acum > 0 && !info.allGraded && (
                        <span className="text-base">{info.passing ? '😊' : info.impossible ? '😔' : ''}</span>
                      )}
                      <span className={`text-2xl font-black tabular-nums ${info.acum > 0 ? gradeColor(info.acum) : 'text-white/15'}`}>
                        {info.acum > 0 ? info.acum.toFixed(2) : '—'}
                      </span>
                      <ChevronDown size={18} className={`text-white/25 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* ── Grade cells + sim inputs ── */}
                {curso.cal_disponible && (
                  <div className="px-5 pb-4" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {PARTS.map(([kw, w]) => {
                        const { val, real } = effScore(comps, kw, curso.codigo)
                        const simKey = `${curso.codigo}-${kw}`
                        const isEmpty = !real

                        return (
                          <div key={kw} className={`flex-1 rounded-xl p-2.5 text-center transition-all ${
                            isEmpty
                              ? 'border border-dashed border-accent/30 bg-accent/5'
                              : 'bg-white/5'
                          }`}>
                            <p className="text-[7px] font-black uppercase tracking-widest text-white/30 mb-1.5">{kw}</p>
                            {isEmpty ? (
                              <input
                                type="number" min="1" max="20" step="0.1"
                                placeholder="—"
                                value={simGrades[simKey] || ''}
                                onChange={e => {
                                  const raw = e.target.value
                                  if (raw === '' || raw === '-') { setSimGrades(p => ({ ...p, [simKey]: raw })); return }
                                  const n = parseFloat(raw)
                                  if (!isNaN(n) && n > 20) { setSimGrades(p => ({ ...p, [simKey]: '20' })); return }
                                  setSimGrades(p => ({ ...p, [simKey]: raw }))
                                }}
                                onBlur={e => {
                                  const n = parseFloat(e.target.value)
                                  if (isNaN(n) || e.target.value === '') { setSimGrades(p => ({ ...p, [simKey]: '' })); return }
                                  const clamped = Math.min(20, Math.max(1, Math.round(n * 10) / 10))
                                  setSimGrades(p => ({ ...p, [simKey]: String(clamped) }))
                                }}
                                className="w-full bg-transparent text-center text-[15px] font-black text-accent outline-none placeholder-white/20
                                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            ) : (
                              <p className={`text-[15px] font-black leading-none ${gradeColor(val)}`}>{val}</p>
                            )}
                            <p className="text-[7px] text-white/20 mt-1.5">{w}%</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* ── Recommendation bar ── */}
                    {info.missingW > 0 && (() => {
                      const hasSim = info.missing.some(kw => simGrades[`${curso.codigo}-${kw}`])
                      const projLabel = hasSim
                        ? `Proyectado: ${info.acum.toFixed(2)}`
                        : null

                      return (
                        <div className={`mt-2.5 rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${
                          info.impossible   ? 'bg-red-500/10 border border-red-500/20' :
                          info.passing      ? 'bg-[#10b981]/8 border border-[#10b981]/20' :
                                             'bg-white/[0.03] border border-white/5'
                        }`}>
                          <div className="flex-1 min-w-0">
                            {info.impossible ? (
                              <p className="text-[11px] font-black text-red-400">😔 Ya no es posible aprobar</p>
                            ) : info.passing ? (
                              <>
                                <p className="text-[11px] font-black text-[#10b981]">😊 ¡Con lo que tienes ya apruebas!</p>
                                {projLabel && <p className={`text-sm font-black mt-0.5 ${gradeColor(info.acum)}`}>{projLabel}</p>}
                              </>
                            ) : (
                              <>
                                <p className="text-[8px] font-black uppercase text-white/25 mb-1">
                                  Lo que necesitas en {info.missing.join(' y ')}:
                                </p>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className={`text-xl font-black tabular-nums ${
                                    info.minEach > 18 ? 'text-[#ef4444]' :
                                    info.minEach > 13 ? 'text-orange-400' :
                                    info.minEach > 10 ? 'text-yellow-400' : 'text-[#10b981]'
                                  }`}>
                                    {info.minEach > 20 ? '—' : info.minEach.toFixed(2)}
                                  </span>
                                  {info.minEach >= 10.5 && info.minEach < 11.5 && (
                                    <span className="text-[9px] font-black text-white/35 bg-white/5 px-2 py-0.5 rounded-lg">aprox. 11</span>
                                  )}
                                  {info.minEach > 20 && (
                                    <span className="text-[10px] font-black text-red-400">😔 imposible</span>
                                  )}
                                  {projLabel && (
                                    <span className={`text-[10px] font-black ml-2 ${gradeColor(info.acum)}`}>{projLabel}</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 pl-2 border-l border-white/5">
                            <p className="text-[7px] font-black uppercase text-white/20">Acum.</p>
                            <p className={`text-base font-black tabular-nums ${gradeColor(info.acum)}`}>
                              {info.acum.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* ── Expanded component detail ── */}
                {isOpen && (
                  <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3">
                      Detalle de componentes
                    </p>
                    {comps.length === 0 && (
                      <p className="text-[10px] text-white/20 italic text-center py-3">Sin componentes disponibles</p>
                    )}
                    {comps.map((comp, i) => (
                      <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${
                        isSubComponent(comp) ? 'ml-5 border-l-2 border-accent/15 bg-white/[0.02]' : 'bg-white/[0.04]'
                      }`}>
                        <div className="flex-1 min-w-0 pr-3">
                          <p className={`text-[10px] font-bold truncate ${isSubComponent(comp) ? 'text-white/45' : 'text-white/80'}`}>
                            {comp.name?.replace(/^\d+_/, '').replace(/-/g, ' ') || '—'}
                          </p>
                          <div className="flex gap-3 mt-0.5 flex-wrap">
                            {comp.weight && <span className="text-[8px] text-white/20">Peso: {comp.weight}%</span>}
                            {comp.mustPass === 'Sí' && <span className="text-[8px] text-yellow-400/50">Obligatorio</span>}
                          </div>
                        </div>
                        <span className={`text-sm font-black flex-shrink-0 tabular-nums ${gradeColor(comp.score)}`}>
                          {comp.score || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )
          })}
        </div>
      </div>
    )
  }

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
          {activeTab === 'notas' && NotasUpaoView()}
        </div>
      </main>

      <div className="fixed bottom-8 left-0 right-0 z-[60] px-4 sm:px-0 pointer-events-none">
        <nav className="max-w-[400px] mx-auto bg-[#1a1f2e]/90 backdrop-blur-3xl p-3 rounded-[50px] flex justify-between items-center shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 pointer-events-auto">
          <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center py-3.5 rounded-[40px] transition-all ${activeTab === 'home' ? 'bg-white text-[#0c0e14] font-black shadow-2xl' : 'text-[#aab3cc] hover:text-white'}`}><Home size={22} /><span className="text-[8px] font-black uppercase mt-1">Métricas</span></button>
          <button onClick={() => { setTxMode('create'); setTxForm({titulo:'', monto:'', tipo:'ingreso', comentario:'', fecha: '', cuentaId: '', grupoId: ''}); setIsTxModal(true) }} className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white mx-2 shadow-2xl active:scale-95 transition-transform flex-shrink-0"><PlusCircle size={34} /></button>
          <button onClick={() => setActiveTab('wallet')} className={`flex-1 flex flex-col items-center py-3.5 rounded-[40px] transition-all ${activeTab === 'wallet' ? 'bg-white text-[#0c0e14] font-black shadow-2xl' : 'text-[#aab3cc] hover:text-white'}`}><Wallet size={22} /><span className="text-[8px] font-black uppercase mt-1">Billeteras</span></button>
          <button onClick={() => setActiveTab('notas')} className={`flex-1 flex flex-col items-center py-3.5 rounded-[40px] transition-all ${activeTab === 'notas' ? 'bg-white text-[#0c0e14] font-black shadow-2xl' : 'text-[#aab3cc] hover:text-white'}`}><GraduationCap size={22} /><span className="text-[8px] font-black uppercase mt-1">Notas</span></button>
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

      {isPagoModal && <Modal title={pagoMode === 'create' ? 'Nuevo Pago Mensual' : 'Editar Pago Mensual'} onClose={() => setIsPagoModal(false)}>
          <div className="space-y-6">
              <input autoFocus placeholder="Nombre del pago (Ej: Luz, Agua, Internet...)" className="w-full bg-white/5 border border-white/10 py-6 px-6 rounded-3xl outline-none focus:border-purple-500 transition-all text-white font-bold" value={pagoForm.nombre} onChange={e => setPagoForm({...pagoForm, nombre: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                  <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 font-black">{CURRENCY}</span><input type="number" placeholder="0.00" className="w-full bg-white/5 border border-white/10 pl-14 py-6 rounded-3xl font-black text-2xl outline-none text-white focus:border-purple-500" value={pagoForm.monto} onChange={e => setPagoForm({...pagoForm, monto: e.target.value})} /></div>
                  <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-black uppercase">Día</span><input type="number" min="1" max="31" placeholder="15" className="w-full bg-white/5 border border-white/10 pl-14 py-6 rounded-3xl font-black text-2xl outline-none text-white focus:border-purple-500 text-center" value={pagoForm.diaPago} onChange={e => setPagoForm({...pagoForm, diaPago: e.target.value})} /></div>
              </div>
              <textarea placeholder="Comentario opcional..." className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none focus:border-purple-500 transition-all text-white font-medium text-sm h-24 resize-none" value={pagoForm.comentario} onChange={e => setPagoForm({...pagoForm, comentario: e.target.value})} />
              
              {/* Categoría */}
              {(() => {
                const cid = pagoForm.cuentaId || selectedAccountId
                const cta = cuentas.find(b => String(b.id) === String(cid))
                const grupos = cta?.grupos || []
                return grupos.length > 0 ? (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Categoría</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setPagoForm({...pagoForm, grupoId: ''})} className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all border ${!pagoForm.grupoId ? 'bg-white/10 text-white border-white/20' : 'bg-white/3 text-white/30 border-transparent'}`}>Sin categoría</button>
                      {grupos.map(g => (
                        <button key={g.id} onClick={() => setPagoForm({...pagoForm, grupoId: g.id})} className="px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border" style={{
                          backgroundColor: String(pagoForm.grupoId) === String(g.id) ? `${g.color}25` : 'rgba(255,255,255,0.03)',
                          color: String(pagoForm.grupoId) === String(g.id) ? g.color : 'rgba(255,255,255,0.3)',
                          borderColor: String(pagoForm.grupoId) === String(g.id) ? `${g.color}50` : 'transparent'
                        }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }}></span>
                          {g.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}

              {pagoMode === 'edit' && (
                <select className="w-full bg-white/5 border border-white/10 py-5 px-6 rounded-3xl text-[11px] font-black uppercase text-white outline-none appearance-none cursor-pointer focus:border-purple-500" value={pagoForm.cuentaId} onChange={e => setPagoForm({...pagoForm, cuentaId: e.target.value, grupoId: ''})}>
                    <option value="" className="bg-[#1a1f2e]">--- BILLETERA ---</option>
                    {cuentas.map(b => <option key={b.id} value={b.id} className="bg-[#1a1f2e]">{b.nombre}</option>)}
                </select>
              )}

              {!selectedAccountId && pagoMode === 'create' && (
                <select className="w-full bg-white/5 border border-white/10 py-5 px-6 rounded-3xl text-[11px] font-black uppercase text-white outline-none appearance-none cursor-pointer focus:border-purple-500" value={pagoForm.cuentaId} onChange={e => setPagoForm({...pagoForm, cuentaId: e.target.value, grupoId: ''})}>
                    <option value="" className="bg-[#1a1f2e]">--- SELECCIONAR BILLETERA ---</option>
                    {cuentas.map(b => <option key={b.id} value={b.id} className="bg-[#1a1f2e]">{b.nombre}</option>)}
                </select>
              )}
              
              <button onClick={handleSavePago} className="w-full py-7 bg-purple-600 font-black uppercase tracking-[0.3em] text-[10px] rounded-[35px] text-white shadow-2xl transition-all active:scale-95 hover:brightness-110">{pagoMode === 'create' ? 'Crear Pago Mensual' : 'Guardar Cambios'}</button>
          </div>
      </Modal>}

      {/* ── MODAL VER NOTA DE TRANSACCIÓN ── */}
      {viewNoteModal && viewNoteData && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-lg animate-fade-in"
          onClick={() => setViewNoteModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.7)] border border-white/10"
            style={{
              background: 'linear-gradient(145deg, #1e2336 0%, #141824 100%)',
              borderTop: `3px solid ${viewNoteData.tipo === 'ingreso' ? '#10b981' : '#ef4444'}`
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-7 pt-7 pb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: viewNoteData.tipo === 'ingreso' ? '#10b98125' : '#ef444425' }}
                >
                  <StickyNote size={18} style={{ color: viewNoteData.tipo === 'ingreso' ? '#10b981' : '#ef4444' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: viewNoteData.tipo === 'ingreso' ? '#10b981' : '#ef4444' }}>
                    {viewNoteData.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} · Nota
                  </p>
                  <h3 className="text-base font-black text-white leading-tight truncate">{viewNoteData.titulo}</h3>
                </div>
              </div>
              <button
                onClick={() => setViewNoteModal(false)}
                className="flex-shrink-0 p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={18} className="text-white/60" />
              </button>
            </div>

            {/* Meta: categoría + fecha */}
            <div className="px-7 pb-4 flex flex-wrap items-center gap-2">
              {viewNoteData.grupo && (
                <span
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider"
                  style={{ backgroundColor: `${viewNoteData.grupo.color}20`, color: viewNoteData.grupo.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: viewNoteData.grupo.color }}></span>
                  {viewNoteData.grupo.nombre}
                </span>
              )}
              {viewNoteData.fecha && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white/5 text-white/30">
                  <Clock size={10} />
                  {formatDate(viewNoteData.fecha).date} · {formatDate(viewNoteData.fecha).time}
                </span>
              )}
            </div>

            {/* Separador */}
            <div className="mx-7 h-px bg-white/5 mb-5" />

            {/* Contenido de la nota */}
            <div className="px-7 pb-8">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3 flex items-center gap-2">
                <StickyNote size={10} /> Comentario
              </p>
              <div
                className="p-5 rounded-[22px] border border-white/5 leading-relaxed text-sm text-white/80 font-medium whitespace-pre-wrap"
                style={{
                  background: viewNoteData.tipo === 'ingreso'
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)',
                  borderColor: viewNoteData.tipo === 'ingreso' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'
                }}
              >
                {viewNoteData.comentario}
              </div>
            </div>

            {/* Footer tap-to-close hint */}
            <div className="pb-6 flex justify-center">
              <p className="text-[8px] text-white/15 font-medium tracking-widest uppercase">Toca fuera para cerrar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
