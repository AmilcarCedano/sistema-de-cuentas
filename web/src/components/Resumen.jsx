export default function Resumen({ ingresos, egresos }) {
  const totalIngresos = ingresos.reduce((sum, ing) => sum + ing.monto, 0)
  const totalEgresos = egresos.reduce((sum, egr) => sum + egr.monto, 0)
  const balance = totalIngresos - totalEgresos

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta Ingresos */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Total Ingresos</p>
              <h3 className="text-3xl font-bold">${totalIngresos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs opacity-75 mt-2">{ingresos.length} movimiento(s)</p>
            </div>
            <div className="text-5xl">📈</div>
          </div>
        </div>

        {/* Tarjeta Egresos */}
        <div className="bg-gradient-to-br from-red-400 to-red-600 text-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Total Egresos</p>
              <h3 className="text-3xl font-bold">${totalEgresos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs opacity-75 mt-2">{egresos.length} movimiento(s)</p>
            </div>
            <div className="text-5xl">📉</div>
          </div>
        </div>

        {/* Tarjeta Balance */}
        <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-400 to-blue-600' : 'from-orange-400 to-orange-600'} text-white p-8 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Balance</p>
              <h3 className="text-3xl font-bold">${balance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs opacity-75 mt-2">{balance >= 0 ? '✅ Ganancia' : '⚠️ Pérdida'}</p>
            </div>
            <div className="text-5xl">💰</div>
          </div>
        </div>
      </div>

      {/* Gráfico simple de últimos movimientos */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">📅 Últimos Movimientos</h2>
        <div className="space-y-3">
          {[...ingresos, ...egresos]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 10)
            .map((mov) => (
              <div key={`${mov.tipo}-${mov.id}`} className="flex items-center justify-between p-3 rounded bg-[rgba(255,255,255,0.01)]">
                <div>
                  <p className="font-semibold text-white">{mov.concepto}</p>
                  <p className="text-sm muted">{new Date(mov.fecha).toLocaleDateString('es-CO')}</p>
                </div>
                <p className={`font-bold text-lg ${mov.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                  {mov.tipo === 'ingreso' ? '+' : '-'}${mov.monto.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
