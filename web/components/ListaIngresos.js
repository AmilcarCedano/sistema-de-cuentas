'use client';

import { useEffect, useState } from 'react';

export default function ListaIngresos({ refresh }) {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIngresos();
  }, [refresh]);

  const fetchIngresos = async () => {
    try {
      const response = await fetch('/api/ingresos');
      const data = await response.json();
      setIngresos(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este ingreso?')) return;

    try {
      const response = await fetch(`/api/ingresos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchIngresos();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) return <p>Cargando ingresos...</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-bold text-green-900 mb-4">Ingresos</h3>

      {ingresos.length === 0 ? (
        <p className="text-gray-500">No hay ingresos registrados</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-green-100">
              <tr>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Descripción</th>
                <th className="px-4 py-2 text-left">Categoría</th>
                <th className="px-4 py-2 text-right">Cantidad</th>
                <th className="px-4 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map((ingreso) => (
                <tr key={ingreso.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {new Date(ingreso.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{ingreso.descripcion}</td>
                  <td className="px-4 py-2">{ingreso.categoria}</td>
                  <td className="px-4 py-2 text-right font-bold text-green-600">
                    +${ingreso.cantidad.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleDelete(ingreso.id)}
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
