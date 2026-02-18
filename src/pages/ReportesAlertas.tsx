import { useEffect, useState } from 'react';
import { api } from '../services/api';

type Alerta = {
  id: string;
  tipo: string;
  estado: string;
  variacion: number;
  variacionPorcentaje: number;
  descripcion: string;
  fechaCreacion: string;
  fechaResolucion: string | null;
  pallet: {
    codigoIndependiente: string;
    codigo: string;
    pesoTotal: number;
    pesoDescarga: number;
    vehicle: {
      placa: string;
      cliente: string;
      codigoTrazabilidad: string;
    };
  };
};

export default function ReportesAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todas' | 'activas' | 'resueltas'>('todas');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'VARIACION_PESO' | 'EXCESO_VEHICULO'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAlertas();
  }, []);

  const loadAlertas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/alertas');
      
      let data = res.data;
      if (data && typeof data === 'object' && 'data' in data) {
        data = data.data;
      }
      
      const alertasArray = Array.isArray(data) ? data : [];
      setAlertas(alertasArray);
    } catch (e: any) {
      console.error('Error al cargar alertas:', e);
      setError(e.message || 'Error al cargar alertas');
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlertas = Array.isArray(alertas) ? alertas.filter((a) => {
    // Filtro por estado
    if (filter === 'activas' && a.estado !== 'ACTIVA') return false;
    if (filter === 'resueltas' && a.estado !== 'RESUELTA') return false;
    
    // Filtro por tipo
    if (tipoFilter !== 'todos' && a.tipo !== tipoFilter) return false;
    
    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const placa = a.pallet?.vehicle?.placa?.toLowerCase() || '';
      const cliente = a.pallet?.vehicle?.cliente?.toLowerCase() || '';
      const codigo = a.pallet?.codigoIndependiente?.toLowerCase() || a.pallet?.codigo?.toLowerCase() || '';
      
      if (!placa.includes(term) && !cliente.includes(term) && !codigo.includes(term)) {
        return false;
      }
    }
    
    return true;
  }) : [];

  const getEstadoBadge = (estado: string) => {
    if (estado === 'ACTIVA') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-red-500/20 text-red-400">
          ACTIVA
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded bg-green-500/20 text-green-400">
        RESUELTA
      </span>
    );
  };

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'VARIACION_PESO') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-orange-500/20 text-orange-400">
          Variación
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-500/20 text-purple-400">
        Exceso
      </span>
    );
  };

  const extractPalletNumber = (codigo: string) => {
    if (!codigo) return 'N/A';
    const parts = codigo.split('-');
    return parts.length > 2 ? parts[2] : codigo;
  };

  const formatVariacion = (variacion: any) => {
    const num = Number(variacion || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Estado', 'Placa', 'Cliente', 'Código Pallet', 'Peso Original', 'Peso Despacho', 'Variación %', 'Descripción'];
    const rows = filteredAlertas.map(a => [
      new Date(a.fechaCreacion).toLocaleString('es-EC'),
      a.tipo === 'VARIACION_PESO' ? 'Variación de Peso' : 'Exceso de Vehículo',
      a.estado,
      a.pallet?.vehicle?.placa || 'N/A',
      a.pallet?.vehicle?.cliente || 'N/A',
      a.pallet?.codigoIndependiente || a.pallet?.codigo || 'N/A',
      a.pallet?.pesoTotal || 0,
      a.pallet?.pesoDescarga || 0,
      formatVariacion(a.variacionPorcentaje),
      a.descripcion || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alertas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const stats = {
    total: filteredAlertas.length,
    activas: filteredAlertas.filter(a => a.estado === 'ACTIVA').length,
    resueltas: filteredAlertas.filter(a => a.estado === 'RESUELTA').length,
    variacionPeso: filteredAlertas.filter(a => a.tipo === 'VARIACION_PESO').length,
    excesoVehiculo: filteredAlertas.filter(a => a.tipo === 'EXCESO_VEHICULO').length,
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Reportes de Alertas</h1>
        <button
          onClick={exportToCSV}
          disabled={filteredAlertas.length === 0}
          className="h-10 px-5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition font-medium"
        >
          Exportar CSV
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard title="Total Alertas" value={stats.total} />
        <StatCard title="Activas" value={stats.activas} />
        <StatCard title="Resueltas" value={stats.resueltas} />
        <StatCard title="Variación Peso" value={stats.variacionPeso} />
        <StatCard title="Exceso Vehículo" value={stats.excesoVehiculo} />
      </div>

      {/* Filtros */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por placa, cliente o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Filtros en fila */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-gray-300">Estado:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('todas')}
                className={`h-10 px-4 text-sm rounded-lg transition font-medium ${
                  filter === 'todas'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('activas')}
                className={`h-10 px-4 text-sm rounded-lg transition font-medium ${
                  filter === 'activas'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => setFilter('resueltas')}
                className={`h-10 px-4 text-sm rounded-lg transition font-medium ${
                  filter === 'resueltas'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Resueltas
              </button>
            </div>

            <span className="text-sm text-gray-300 ml-4">Tipo:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setTipoFilter('todos')}
                className={`h-10 px-4 text-sm rounded-lg transition font-medium ${
                  tipoFilter === 'todos'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTipoFilter('VARIACION_PESO')}
                className={`h-10 px-4 text-sm rounded-lg transition font-medium ${
                  tipoFilter === 'VARIACION_PESO'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Variación
              </button>
              <button
                onClick={() => setTipoFilter('EXCESO_VEHICULO')}
                className={`h-10 px-4 text-sm rounded-lg transition font-medium ${
                  tipoFilter === 'EXCESO_VEHICULO'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Exceso
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabla de Alertas */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-5">
          Listado de Alertas
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin border-b-2 border-gray-400 rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">⚠️ {error}</p>
            <button
              onClick={loadAlertas}
              className="h-10 px-5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : filteredAlertas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No se encontraron alertas con los filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Placa</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Pallet</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Descripción</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Resolución</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlertas.map((alerta) => (
                  <tr
                    key={alerta.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {new Date(alerta.fechaCreacion).toLocaleString('es-EC', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      {getTipoBadge(alerta.tipo)}
                    </td>
                    <td className="py-3 px-4">
                      {getEstadoBadge(alerta.estado)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-100">
                      {alerta.pallet?.vehicle?.placa || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {alerta.pallet?.vehicle?.cliente || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-gray-400">
                        {alerta.pallet?.codigoIndependiente || alerta.pallet?.codigo || 'N/A'}
                      </div>
                      <div className="font-bold text-brand-orange">
                        #{extractPalletNumber(alerta.pallet?.codigoIndependiente || alerta.pallet?.codigo || '')}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="text-xs text-gray-300 line-clamp-2">
                        {alerta.descripcion || 'Sin descripción'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {alerta.fechaResolucion ? (
                        new Date(alerta.fechaResolucion).toLocaleString('es-EC', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/10">
      <div className="text-sm text-gray-300">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="mt-3 h-1 w-full bg-brand-orange rounded-full" />
    </div>
  );
}
