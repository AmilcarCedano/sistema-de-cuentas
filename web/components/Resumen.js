'use client';

import { useEffect, useState } from 'react';

export default function Resumen({ refresh }) {
  const [totales, setTotales] = useState({
    ingresos: 0,
    egresos: 0,
    saldo: 0,
  });

  useEffect(() => {
    fetchTotales();
  }, [refresh]);

  const fetchTotales = async () => {
    try {
      const [ingResponse, egrResponse] = await Promise.all([
        fetch('/api/ingresos'),
        fetch('/api/egresos'),
      ]);

      const ingresos = await ingResponse.json();
      const egresos = await egrResponse.json();

      const totalIngresos = ingresos.reduce((sum, ing) => sum + ing.cantidad, 0);
      const totalEgresos = egresos.reduce((sum, egr) => sum + egr.cantidad, 0);

      setTotales({
        ingresos: totalIngresos,
        egresos: totalEgresos,
        saldo: totalIngresos - totalEgresos,
      });
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const saldoColor = totales.saldo >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-green-100 p-6 rounded-lg shadow text-center">
        <p className="text-gray-600 mb-2">Ingresos</p>
        <p className="text-3xl font-bold text-green-600">
          ${totales.ingresos.toFixed(2)}
        </p>
      </div>

      <div className="bg-red-100 p-6 rounded-lg shadow text-center">
        <p className="text-gray-600 mb-2">Egresos</p>
        <p className="text-3xl font-bold text-red-600">
          ${totales.egresos.toFixed(2)}
        </p>
      </div>

      <div className="bg-blue-100 p-6 rounded-lg shadow text-center">
        <p className="text-gray-600 mb-2">Saldo</p>
        <p className={`text-3xl font-bold ${saldoColor}`}>
          ${totales.saldo.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
