import { useEffect, useState } from 'react';
import { api } from '../services/api';
import * as XLSX from 'xlsx';

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
    product?: {
      nombre: string;
    };
  };
};

export default function ReportesAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todas' | 'activas' | 'resueltas'>('todas');
  // 'EXCESO' agrupa EXCESO_VEHICULO, EXCESO_ALTO y EXCESO_PROMEDIO ya que
  // todos representan exceso de peso desde el punto de vista del usuario.
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'VARIACION_PESO' | 'EXCESO'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Tipos que representan exceso de peso (cualquiera de sus variantes).
  const TIPOS_EXCESO = [
    'EXCESO_VEHICULO',
    'EXCESO_ALTO',
    'EXCESO_PROMEDIO',
    'DIFERENCIA_CARGA',
  ];
  const esExceso = (tipo: string) => TIPOS_EXCESO.includes(tipo);

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
    if (tipoFilter === 'VARIACION_PESO' && a.tipo !== 'VARIACION_PESO') return false;
    if (tipoFilter === 'EXCESO' && !esExceso(a.tipo)) return false;
    
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
        REPESAJE
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
    if (tipo === 'EXCESO_ALTO') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-red-500/20 text-red-400">
          Exceso alto
        </span>
      );
    }
    if (tipo === 'EXCESO_PROMEDIO') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-500/20 text-yellow-400">
          Exceso promedio
        </span>
      );
    }
    // EXCESO_VEHICULO o fallback
    return (
      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-500/20 text-purple-400">
        Exceso vehículo
      </span>
    );
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'VARIACION_PESO':
        return 'Variación de Peso';
      case 'EXCESO_ALTO':
        return 'Exceso Alto';
      case 'EXCESO_PROMEDIO':
        return 'Exceso Promedio';
      case 'EXCESO_VEHICULO':
        return 'Exceso de Vehículo';
      default:
        return tipo;
    }
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

  const exportToExcel = () => {
    const data = filteredAlertas.map((a, idx) => {
      const fechaCreacion = new Date(a.fechaCreacion);
      const fechaResolucion = a.fechaResolucion ? new Date(a.fechaResolucion) : null;
      
      return {
        'ID': idx + 1,
        'Fecha Creación': fechaCreacion.toLocaleDateString('es-EC', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }),
        'Hora Creación': fechaCreacion.toLocaleTimeString('es-EC', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        'Día de la Semana': fechaCreacion.toLocaleDateString('es-EC', { weekday: 'long' }),
        'Tipo de Alerta': getTipoLabel(a.tipo),
        'Estado': a.estado === 'ACTIVA' ? 'Activa' : 'Repesaje',
        'Placa Vehículo': a.pallet?.vehicle?.placa || 'N/A',
        'Cliente': a.pallet?.vehicle?.cliente || 'N/A',
        'Código Trazabilidad': a.pallet?.vehicle?.codigoTrazabilidad || 'N/A',
        'Código Pallet': a.pallet?.codigoIndependiente || a.pallet?.codigo || 'N/A',
        'Producto': a.pallet?.product?.nombre || 'N/A',
        'Peso Original (kg)': Number(a.pallet?.pesoTotal || 0).toFixed(2),
        'Peso Despacho (kg)': Number(a.pallet?.pesoDescarga || 0).toFixed(2),
        'Variación (kg)': Number(a.variacion || 0).toFixed(2),
        'Variación %': formatVariacion(a.variacionPorcentaje) + '%',
        'Descripción': a.descripcion || '',
        'Fecha Resolución': fechaResolucion 
          ? fechaResolucion.toLocaleDateString('es-EC', { year: 'numeric', month: '2-digit', day: '2-digit' })
          : 'Pendiente',
        'Hora Resolución': fechaResolucion 
          ? fechaResolucion.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : 'Pendiente',
        'Tiempo de Resolución (horas)': fechaResolucion 
          ? ((fechaResolucion.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60)).toFixed(2)
          : 'Pendiente',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 8 },  // ID
      { wch: 15 }, // Fecha Creación
      { wch: 15 }, // Hora Creación
      { wch: 15 }, // Día
      { wch: 20 }, // Tipo
      { wch: 12 }, // Estado
      { wch: 15 }, // Placa
      { wch: 30 }, // Cliente
      { wch: 25 }, // Código Trazabilidad
      { wch: 30 }, // Código Pallet
      { wch: 25 }, // Producto
      { wch: 18 }, // Peso Original
      { wch: 18 }, // Peso Despacho
      { wch: 15 }, // Variación kg
      { wch: 12 }, // Variación %
      { wch: 50 }, // Descripción
      { wch: 18 }, // Fecha Resolución
      { wch: 18 }, // Hora Resolución
      { wch: 25 }, // Tiempo Resolución
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alertas');

    XLSX.writeFile(workbook, `alertas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const stats = {
    total: filteredAlertas.length,
    activas: filteredAlertas.filter(a => a.estado === 'ACTIVA').length,
    resueltas: filteredAlertas.filter(a => a.estado === 'RESUELTA').length,
    variacionPeso: filteredAlertas.filter(a => a.tipo === 'VARIACION_PESO').length,
    exceso: filteredAlertas.filter(a => esExceso(a.tipo)).length,
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Reportes de Alertas</h1>
        <button
          onClick={exportToExcel}
          disabled={filteredAlertas.length === 0}
          className="h-10 px-5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition font-medium"
        >
          Exportar Excel
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard title="Total Alertas" value={stats.total} />
        <StatCard title="Activas" value={stats.activas} />
        <StatCard title="Repesaje" value={stats.resueltas} />
        <StatCard title="Variación Peso" value={stats.variacionPeso} />
        <StatCard title="Exceso de Peso" value={stats.exceso} />
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
                Repesaje
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
                onClick={() => setTipoFilter('EXCESO')}
                className={`h-10 px-4 text-sm rounded-lg transition font-medium ${
                  tipoFilter === 'EXCESO'
                    ? 'bg-brand-orange text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Exceso de Peso
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
            <p className="text-red-400 mb-4">Error: {error}</p>
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
