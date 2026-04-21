import { useEffect, useState, useMemo } from 'react';
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
  metadata?: {
    pesoIngresoVehiculo: number | null;
    pesoSalidaVehiculo: number | null;
    sumaPallets: number | null;
    pesoEsperadoPallets: number;
    pesoEstimadoCamion: number;
  };
  pallet: {
    codigoIndependiente: string;
    codigo: string;
    pesoTotal: number;
    pesoDescarga: number;
    vehicle: {
      placa: string;
      pesoIngreso?: number;
      pesoSalida?: number;
    };
  };
};

interface HistorialAlertasProps {
  /**
   * Cambiar este valor fuerza un refresco del historial. Útil para que el
   * componente padre (por ejemplo, el botón "Actualizar Dashboard") también
   * refresque las alertas sin duplicar lógica.
   */
  refreshKey?: number;
}

export default function HistorialAlertas({ refreshKey = 0 }: HistorialAlertasProps = {}) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todas' | 'activas' | 'resueltas'>('todas');

  useEffect(() => {
    // En el primer render refreshKey=0 → carga normal.
    // En cambios posteriores se trata como refresco manual para mostrar el spinner.
    loadAlertas(refreshKey > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const loadAlertas = async (isManualRefresh = false) => {
    try {
      setError(null);
      if (isManualRefresh) {
        setRefreshing(true);
      }
      const resAlertas = await api.get('/alertas');

      // Procesar alertas generales
      let data = resAlertas.data;
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
      setRefreshing(false);
    }
  };

  const filteredAlertas = useMemo(() => {
    return Array.isArray(alertas) ? alertas.filter((a) => {
      if (filter === 'activas') return a.estado === 'ACTIVA';
      if (filter === 'resueltas') return a.estado === 'RESUELTA';
      return true;
    }) : [];
  }, [alertas, filter]);

  const getAlertColor = (tipo: string) => {
    if (tipo === 'VARIACION_PESO') return 'bg-orange-500/20 border-orange-500/40';
    if (tipo === 'EXCESO_VEHICULO') return 'bg-red-500/20 border-red-500/40';
    if (tipo === 'EXCESO_PROMEDIO') return 'bg-yellow-500/20 border-yellow-500/40';
    if (tipo === 'EXCESO_ALTO') return 'bg-red-600/20 border-red-600/40';
    return 'bg-yellow-500/20 border-yellow-500/40';
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === 'ACTIVA') {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
          ACTIVA
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/40">
        REPESAJE
      </span>
    );
  };

  const extractPalletNumber = (codigo: string) => {
    if (!codigo) return 'N/A';
    // Extraer el número del código PALL-MESAÑO-N
    const parts = codigo.split('-');
    return parts.length > 2 ? parts[2] : codigo;
  };

  const formatVariacion = (variacion: any) => {
    const num = Number(variacion || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Historial de Alertas</h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => loadAlertas(true)}
            disabled={refreshing}
            className="px-3 py-1 text-sm rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            title="Recargar alertas"
          >
            {refreshing && (
              <span className="inline-block h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button
            onClick={() => setFilter('todas')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'todas'
                ? 'bg-brand-orange text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('activas')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'activas'
                ? 'bg-brand-orange text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => setFilter('resueltas')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'resueltas'
                ? 'bg-brand-orange text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            Repesaje
          </button>
          {/* Pestaña "Diferencia de Pallets" oculta - ya no se crean estas alertas */}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          Cargando alertas...
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <p className="text-red-400 mb-2">Error: {error}</p>
          <button
            onClick={() => loadAlertas(true)}
            className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : filteredAlertas.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          {filter === 'todas' ? 'No hay alertas registradas' : `No hay alertas ${filter}`}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2 font-semibold">Código Pallet</th>
                <th className="text-left py-3 px-2 font-semibold">N° Pallet</th>
                <th className="text-left py-3 px-2 font-semibold">Placa</th>
                <th className="text-right py-3 px-2 font-semibold">Peso Ingreso</th>
                <th className="text-right py-3 px-2 font-semibold">Peso Despacho</th>
                <th className="text-right py-3 px-2 font-semibold">Variación %</th>
                <th className="text-left py-3 px-2 font-semibold">Tipo</th>
                <th className="text-left py-3 px-2 font-semibold">Fecha</th>
                <th className="text-center py-3 px-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlertas.map((alerta) => (
                <tr
                  key={alerta.id}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${getAlertColor(alerta.tipo)}`}
                >
                  <td className="py-3 px-2 font-mono text-xs">
                    {alerta.pallet?.codigoIndependiente || alerta.pallet?.codigo || 'N/A'}
                  </td>
                  <td className="py-3 px-2 font-bold text-brand-orange">
                    {extractPalletNumber(alerta.pallet?.codigoIndependiente || alerta.pallet?.codigo || '')}
                  </td>
                  <td className="py-3 px-2">{alerta.pallet?.vehicle?.placa || 'N/A'}</td>
                  <td className="py-3 px-2 text-right">
                    {Number(alerta.pallet?.pesoTotal || 0).toLocaleString()} kg
                  </td>
                  <td className="py-3 px-2 text-right">
                    {Number(alerta.pallet?.pesoDescarga || 0).toLocaleString()} kg
                  </td>
                  <td className="py-3 px-2 text-right font-semibold">
                    <span
                      className={
                        Math.abs(Number(alerta.variacionPorcentaje || 0)) > 5
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }
                    >
                      {formatVariacion(alerta.variacionPorcentaje)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs">
                    {alerta.tipo === 'VARIACION_PESO' ? 'Variación Peso' : 
                     alerta.tipo === 'EXCESO_PROMEDIO' ? 'Exceso al Promedio' :
                     alerta.tipo === 'EXCESO_ALTO' ? 'Exceso Muy Alto' :
                     'Exceso Vehículo'}
                  </td>
                  <td className="py-3 px-2 text-xs text-gray-400">
                    {new Date(alerta.fechaCreacion).toLocaleString('es-EC', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {getEstadoBadge(alerta.estado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
