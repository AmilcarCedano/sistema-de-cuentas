import { useState } from 'react'

export default function FormEgreso({ onAgregar }) {
  const [formData, setFormData] = useState({ 
    concepto: '', 
    monto: '', 
    fecha: new Date().toISOString().split('T')[0]
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.concepto && formData.monto) {
      onAgregar({
        ...formData,
        monto: parseFloat(formData.monto)
      })
      setFormData({ concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0] })
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-red-400 mb-4">📉 Agregar Egreso</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block muted font-semibold mb-2">Concepto</label>
          <input
            type="text"
            name="concepto"
            value={formData.concepto}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 input-dark rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Ej: Renta, Comida..."
          />
        </div>
        <div>
          <label className="block muted font-semibold mb-2">Monto</label>
          <input
            type="number"
            name="monto"
            value={formData.monto}
            onChange={handleChange}
            required
            step="0.01"
            className="w-full px-4 py-2 input-dark rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block muted font-semibold mb-2">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className="w-full px-4 py-2 input-dark rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button
          type="submit"
          className="w-full btn-red hover:opacity-95 transition"
        >
          ✅ Guardar Egreso
        </button>
      </form>
    </div>
  )
}
