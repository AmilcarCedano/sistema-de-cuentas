'use client';

import { useEffect, useState } from 'react';

export default function ListaEgresos({ refresh }) {
  const [egresos, setEgresos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEgresos();
  }, [refresh]);

  const fetchEgresos = async () => {
    try {
      const response = await fetch('/api/egresos');
      const data = await response.json();
      setEgresos(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este egreso?')) return;

    try {
      const response = await fetch(`/api/egresos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEgresos();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) return <p>Cargando egresos...</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-bold text-red-900 mb-4">Egresos</h3>

      {egresos.length === 0 ? (
        <p className="text-gray-500">No hay egresos registrados</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-red-100">
              <tr>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Descripción</th>
                <th className="px-4 py-2 text-left">Categoría</th>
                <th className="px-4 py-2 text-right">Cantidad</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {egresos.map((egreso) => (
                <tr key={egreso.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {new Date(egreso.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{egreso.descripcion}</td>
                  <td className="px-4 py-2">{egreso.categoria}</td>
                  <td className="px-4 py-2 text-right font-bold text-red-600">
                    -${egreso.cantidad.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleDelete(egreso.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
