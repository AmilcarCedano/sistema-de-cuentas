export default function ListaIngresos({ ingresos, onActualizar }) {
  const handleEliminar = async (id) => {
    try {
      const res = await fetch(`/api/ingresos/${id}`, { method: 'DELETE' })
      if (res.ok) onActualizar()
    } catch (error) {
      console.error('Error eliminando ingreso:', error)
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-green-400 mb-4">📊 Ingresos Registrados</h2>
      {ingresos.length === 0 ? (
        <p className="muted text-center py-8">No hay ingresos registrados</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-green-100">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Concepto</th>
                <th className="px-4 py-2">Monto</th>
                <th className="px-4 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map((ingreso) => (
                <tr key={ingreso.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{new Date(ingreso.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-2">{ingreso.concepto}</td>
                  <td className="px-4 py-2 font-bold text-green-600">${ingreso.monto.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEliminar(ingreso.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                    >
                      ❌ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
