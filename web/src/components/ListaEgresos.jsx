export default function ListaEgresos({ egresos, onActualizar }) {
  const handleEliminar = async (id) => {
    try {
      const res = await fetch(`/api/egresos/${id}`, { method: 'DELETE' })
      if (res.ok) onActualizar()
    } catch (error) {
      console.error('Error eliminando egreso:', error)
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-red-400 mb-4">📊 Egresos Registrados</h2>
      {egresos.length === 0 ? (
        <p className="muted text-center py-8">No hay egresos registrados</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-red-100">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Concepto</th>
                <th className="px-4 py-2">Monto</th>
                <th className="px-4 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {egresos.map((egreso) => (
                <tr key={egreso.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{new Date(egreso.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-2">{egreso.concepto}</td>
                  <td className="px-4 py-2 font-bold text-red-600">${egreso.monto.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleEliminar(egreso.id)}
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
