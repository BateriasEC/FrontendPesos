import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../services/api";
import * as XLSX from "xlsx";
import { Pagination } from "../components/Pagination";
import { DateRange } from "../components/DateRange";
import { LabelModal } from "../components/LabelModal";

type Nivel = {
  nivel: number;
  MED: number;
  G1: number;
  P1: number;
  P2: number;
  P3: number;
  P4: number;
};

type Row = {
  id: number | string;
  fecha: string;
  placa: string;
  codigoPallet: string;
  pesoIngreso: number;
  pesoSalida: number | null;
  variacion: number;
  cliente: string;
  niveles?: Nivel[];
  vehicleId?: string;
  codigoTrazabilidad?: string;
  productNombre?: string;
  pesoTotal?: number;
  pesoDescarga?: number | null;
  variacionPeso?: number | null;
  descargado?: boolean;
  operador?: string;
  codigoRecepcion?: string | null;
  pesoRecibido?: number | null;
  diferenciaRecepcion?: number | null;
  estadoRecepcion?: string;
};

export default function Pesajes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [labelRow, setLabelRow] = useState<Row | null>(null);

  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/pallets");
      const data = res.data?.data?.data || res.data?.data || [];

      setRows(
        data.map((p: any) => {
          const ingreso = Number(p.vehicle?.pesoIngreso || p.pesoTotal || 0);
          const salida =
            p.vehicle?.pesoSalida != null ? Number(p.vehicle.pesoSalida) : null;

          return {
            id: p.id,
            fecha: p.createdAt,
            placa: p.vehicle?.placa || "",
            codigoPallet: p.codigo || "",
            pesoIngreso: ingreso,
            pesoSalida: salida,
            variacion: salida != null ? ingreso - salida : 0,
            cliente: p.vehicle?.cliente || "",
            vehicleId: p.vehicleId,
            codigoTrazabilidad: p.vehicle?.codigoTrazabilidad,
            productNombre: p.product?.nombre,
            pesoTotal: Number(p.pesoTotal) || 0,
            pesoDescarga: p.descargado ? Number(p.pesoDescarga) : null,
            variacionPeso: Number(p.variacionPeso) || null,
            descargado: Boolean(p.descargado),
            operador: p.vehicle?.user?.fullName || p.user?.fullName || 'N/A',
            codigoRecepcion: p.recepcion?.codigoRecepcion ?? null,
            pesoRecibido: p.recepcion?.pesoRecibido != null ? Number(p.recepcion.pesoRecibido) : null,
            diferenciaRecepcion: p.recepcion?.diferenciaPeso != null ? Number(p.recepcion.diferenciaPeso) : null,
            estadoRecepcion: p.recepcion ? 'Recibido' : p.descargado ? 'Pendiente recepción' : 'N/A',
            niveles: [],
          };
        }),
      );
    } catch (error: any) {
      console.error('[Pesajes] Error al cargar datos:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const match =
        !q ||
        r.placa.toLowerCase().includes(q.toLowerCase()) ||
        r.codigoPallet.toLowerCase().includes(q.toLowerCase());

      const d = new Date(r.fecha);

      return (
        match &&
        (!range.from || d >= new Date(range.from)) &&
        (!range.to || d <= new Date(range.to + "T23:59:59"))
      );
    });
  }, [rows, q, range]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const exportExcel = () => {
    try {
      const excelData = filtered.map((row, idx) => {
        const fecha = new Date(row.fecha);
        const diaSemana = fecha.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' });
        
        return {
          'N°': idx + 1,
          'Fecha': fecha.toLocaleDateString('es-EC', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            timeZone: 'America/Bogota'
          }),
          'Día de la Semana': diaSemana,
          'Hora': fecha.toLocaleTimeString('es-EC', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            timeZone: 'America/Bogota'
          }),
          'Placa Vehículo': row.placa,
          'Código Trazabilidad': row.codigoTrazabilidad || 'N/A',
          'Operador': row.operador || 'N/A',
          'Código Pallet': row.codigoPallet,
          'Producto': row.productNombre || 'N/A',
          'Peso Ingreso Vehículo (kg)': Number(row.pesoIngreso).toFixed(2),
          'Peso Salida Vehículo (kg)': row.pesoSalida ? Number(row.pesoSalida).toFixed(2) : 'Pendiente',
          'Diferencia Vehículo (kg)': Number(row.variacion).toFixed(2),
          'Peso Pallet (kg)': Number(row.pesoTotal || 0).toFixed(2),
          'Peso Despacho Pallet (kg)': row.pesoDescarga ? Number(row.pesoDescarga).toFixed(2) : 'Pendiente',
          'Variación Pallet (kg)': row.variacionPeso ? Number(row.variacionPeso).toFixed(2) : 'N/A',
          'Estado Despacho': row.descargado ? 'Despachado' : 'Pendiente',
          'Cód. Recepción': row.codigoRecepcion || 'N/A',
          'Peso Recibido (kg)': row.pesoRecibido != null ? Number(row.pesoRecibido).toFixed(2) : 'N/A',
          'Diferencia Recepción (kg)': row.diferenciaRecepcion != null ? Number(row.diferenciaRecepcion).toFixed(2) : 'N/A',
          'Estado Recepción': row.estadoRecepcion || 'N/A',
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 8 },  // N°
        { wch: 12 }, // Fecha
        { wch: 15 }, // Día
        { wch: 12 }, // Hora
        { wch: 12 }, // Placa
        { wch: 25 }, // Código Trazabilidad
        { wch: 20 }, // Operador
        { wch: 30 }, // Código Pallet
        { wch: 25 }, // Producto
        { wch: 22 }, // Peso Ingreso
        { wch: 22 }, // Peso Salida
        { wch: 22 }, // Diferencia Vehículo
        { wch: 18 }, // Peso Pallet
        { wch: 22 }, // Peso Despacho
        { wch: 20 }, // Variación Pallet
        { wch: 18 }, // Estado
      ];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pesajes");
      
      const fechaActual = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `pesajes_${fechaActual}.xlsx`);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al exportar Excel");
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* HEADER */}
      <h1 className="text-2xl font-bold">PESAJES</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-gray-400 uppercase">
            Total Pallets Registrados
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {filtered.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-gray-400 uppercase">Peso Total Pallets</p>
          <p className="mt-1 text-2xl font-semibold">
            {filtered.reduce((a, b) => a + (b.pesoTotal || 0), 0).toLocaleString()} kg
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* BUSCAR */}
          <div className="flex flex-col gap-1 justify-end w-full">
            <label className="text-x text-white-400 font-medium">Buscar</label>
            <input
              className="input h-11 w-full text-sm" // mismo tamaño que DateRange
              placeholder="Placa o código pallet"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* RANGO FECHAS */}
          <div className="flex flex-col gap-1 justify-end w-full">
            <label className="text-xs text-gray-400 font-medium invisible">
              Fecha
            </label>
            <DateRange from={range.from} to={range.to} onChange={setRange} />
          </div>

          {/* EXPORTAR */}
          <div className="flex justify-end self-end">
            <button
              onClick={exportExcel}
              className="h-10 px-4 text-sm rounded-lg bg-green-600 hover:bg-green-700 transition font-medium whitespace-nowrap"
            >
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* TABLA */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-orange" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="table w-full">
            <thead className="bg-white/10 sticky top-0 z-10">
              <tr>
                <th>Fecha</th>
                <th>Placa</th>
                <th>Número de Pallet</th>
                <th className="text-right">Peso del Pallet</th>
                <th className="text-right">Peso de Despacho</th>
                <th className="text-right">Peso Recibido</th>
                <th className="text-right">Dif. Recepción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No existen registros de pesaje
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition">
                    <td>{new Date(r.fecha).toLocaleString()}</td>
                    <td className="font-medium">{r.placa}</td>
                    <td className="font-mono">{r.codigoPallet}</td>
                    <td className="text-right font-semibold">
                      {(r.pesoTotal || 0).toLocaleString()} kg
                    </td>
                    <td className="text-right">
                      {r.pesoDescarga ? (
                        <span className="font-semibold text-blue-400">
                          {r.pesoDescarga.toLocaleString()} kg
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="text-right">
                      {r.pesoRecibido != null ? (
                        <span className="font-semibold text-emerald-400">
                          {r.pesoRecibido.toLocaleString()} kg
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="text-right">
                      {r.diferenciaRecepcion != null ? (
                        <span className={`font-semibold ${Math.abs(r.diferenciaRecepcion) > 0.01 ? 'text-red-400' : 'text-green-400'}`}>
                          {r.diferenciaRecepcion > 0 ? '+' : ''}{r.diferenciaRecepcion.toFixed(2)} kg
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => setLabelRow(r)}
                        className="btn btn-ghost btn-xs"
                      >
                        Ver Reporte
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onChange={setPage}
        />
      </div>

      <LabelModal
        labelData={
          labelRow
            ? {
                id: String(labelRow.id),
                codigoPallet: labelRow.codigoPallet,
                placa: labelRow.placa,
                codigoTrazabilidad: labelRow.codigoTrazabilidad || "",
                fecha: labelRow.fecha,
                productNombre: labelRow.productNombre || "",
                pesoTotal: labelRow.pesoTotal || 0,
                pesoDescarga: labelRow.pesoDescarga ?? null,
                variacionPallet: labelRow.variacionPeso ?? null,
                descargado: labelRow.descargado || false,
              }
            : null
        }
        onClose={() => setLabelRow(null)}
      />
    </div>
  );
}
