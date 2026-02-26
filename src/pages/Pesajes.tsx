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
            niveles: [],
          };
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Agrupar por vehículo para calcular pesos totales
  const vehicleSummary = useMemo(() => {
    const vehicleMap = new Map<string, {
      placa: string;
      pesoIngreso: number;
      pesoSalida: number | null;
      diferencia: number;
      pesoTotalPallets: number;
      palletsCount: number;
      coincidencia: boolean;
      diferenciaPallets: number;
    }>();

    filtered.forEach((row) => {
      if (!row.vehicleId) return;
      
      const key = row.vehicleId;
      if (!vehicleMap.has(key)) {
        vehicleMap.set(key, {
          placa: row.placa,
          pesoIngreso: row.pesoIngreso,
          pesoSalida: row.pesoSalida,
          diferencia: row.variacion,
          pesoTotalPallets: 0,
          palletsCount: 0,
          coincidencia: false,
          diferenciaPallets: 0,
        });
      }

      const vehicle = vehicleMap.get(key)!;
      vehicle.pesoTotalPallets += row.pesoTotal || 0;
      vehicle.palletsCount += 1;
    });

    // Calcular coincidencia y diferencia
    vehicleMap.forEach((vehicle) => {
      vehicle.diferenciaPallets = vehicle.pesoTotalPallets - vehicle.diferencia;
      // Considerar coincidencia si la diferencia es menor a 1% o 10 kg
      const tolerancia = Math.max(vehicle.diferencia * 0.01, 10);
      vehicle.coincidencia = Math.abs(vehicle.diferenciaPallets) <= tolerancia;
    });

    return Array.from(vehicleMap.values());
  }, [filtered]);

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
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pesajes");
    XLSX.writeFile(wb, "pesajes.xlsx");
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
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
