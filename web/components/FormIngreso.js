'use client';

import { useState } from 'react';

export default function FormIngreso({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cantidad: '',
    descripcion: '',
    categoria: 'General',
    notas: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cantidad: parseFloat(form.cantidad),
          descripcion: form.descripcion,
          categoria: form.categoria,
          notas: form.notas,
        }),
      });

      if (!response.ok) throw new Error('Error al crear ingreso');

      setForm({ cantidad: '', descripcion: '', categoria: 'General', notas: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 p-6 rounded-lg shadow">
      <h3 className="text-lg font-bold text-green-900 mb-4">Registrar Ingreso</h3>
      
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <input
        type="number"
        name="cantidad"
        placeholder="Cantidad"
        value={form.cantidad}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 mb-3 border border-green-300 rounded"
      />

      <input
        type="text"
        name="descripcion"
        placeholder="Descripción"
        value={form.descripcion}
        onChange={handleChange}
        required
        className="w-full px-4 py-2 mb-3 border border-green-300 rounded"
      />

      <select
        name="categoria"
        value={form.categoria}
        onChange={handleChange}
        className="w-full px-4 py-2 mb-3 border border-green-300 rounded"
      >
        <option>General</option>
        <option>Salario</option>
        <option>Inversión</option>
        <option>Venta</option>
        <option>Otro</option>
      </select>

      <textarea
        name="notas"
        placeholder="Notas (opcional)"
        value={form.notas}
        onChange={handleChange}
        className="w-full px-4 py-2 mb-3 border border-green-300 rounded"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700"
      >
        {loading ? 'Guardando...' : 'Guardar Ingreso'}
      </button>
    </form>
  );
}
