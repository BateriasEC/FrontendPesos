import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import * as XLSX from "xlsx";
import { Pagination } from "../components/Pagination";
import { DateRange } from "../components/DateRange";
import { LabelModal } from "../components/LabelModal";
import { resolvePesoProductoNetoDisplay } from "../utils/palletNeto";
import { CambiarIngresoModal } from "../components/CambiarIngresoModal";
import {
  DocumentTextIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

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
  tipoOperacion?: string;
  codigoTipoOperacion?: string;
  pesoPalletEstandar?: number | null;
  pesoPalletAplicado?: number | null;
  productoConPallet?: boolean | null;
  pesoProductoNeto?: number | null;
};

export default function Pesajes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [labelRow, setLabelRow] = useState<Row | null>(null);
  const [cambiarIngresoRow, setCambiarIngresoRow] = useState<Row | null>(null);

  const pageSize = 10;

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(handler);
  }, [q]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, range]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/pallets", {
        params: {
          page,
          limit: pageSize,
          search: debouncedQ || undefined,
          fecha_inicio: range.from || undefined,
          fecha_fin: range.to || undefined,
        },
      });

      const responseData = res.data?.data ?? res.data;
      const data = responseData?.data || [];
      const totalCount = responseData?.total ?? 0;
      const weightSum = responseData?.totalWeight ?? 0;

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
            operador: p.vehicle?.user?.fullName || p.user?.fullName || "N/A",
            codigoRecepcion: p.recepcion?.codigoRecepcion ?? null,
            pesoRecibido:
              p.recepcion?.pesoRecibido != null
                ? Number(p.recepcion.pesoRecibido)
                : null,
            diferenciaRecepcion:
              p.recepcion?.diferenciaPeso != null
                ? Number(p.recepcion.diferenciaPeso)
                : null,
            estadoRecepcion: p.recepcion
              ? "Recibido"
              : p.descargado
                ? "Pendiente recepción"
                : "N/A",
            tipoOperacion: p.vehicle?.tipoRecepcion?.nombre || "N/A",
            codigoTipoOperacion: p.vehicle?.tipoRecepcion?.codigo || undefined,
            pesoPalletEstandar:
              p.pesoPalletEstandar != null
                ? Number(p.pesoPalletEstandar)
                : null,
            pesoPalletAplicado:
              p.pesoPalletAplicado != null
                ? Number(p.pesoPalletAplicado)
                : null,
            productoConPallet: p.productoConPallet ?? null,
            pesoProductoNeto: resolvePesoProductoNetoDisplay({
              pesoTotal: Number(p.pesoTotal) || 0,
              pesoPalletAplicado:
                p.pesoPalletAplicado != null
                  ? Number(p.pesoPalletAplicado)
                  : null,
              productoConPallet: p.productoConPallet ?? null,
              codigoTipoOperacion: p.vehicle?.tipoRecepcion?.codigo,
            }),
            niveles: [],
          };
        }),
      );
      setTotal(totalCount);
      setTotalWeight(weightSum);
    } catch (error: any) {
      console.error("[Pesajes] Error al cargar datos:", error);
      setRows([]);
      setTotal(0);
      setTotalWeight(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, range]);

  useEffect(() => {
    load();
  }, [load]);

  const exportExcel = async () => {
    try {
      const res = await api.get("/pallets", {
        params: {
          search: debouncedQ || undefined,
          fecha_inicio: range.from || undefined,
          fecha_fin: range.to || undefined,
        },
      });
      const data = res.data?.data || res.data || [];
      const exportRows = data.map((p: any) => {
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
          operador: p.vehicle?.user?.fullName || p.user?.fullName || "N/A",
          codigoRecepcion: p.recepcion?.codigoRecepcion ?? null,
          pesoRecibido:
            p.recepcion?.pesoRecibido != null
              ? Number(p.recepcion.pesoRecibido)
              : null,
          diferenciaRecepcion:
            p.recepcion?.diferenciaPeso != null
              ? Number(p.recepcion.diferenciaPeso)
              : null,
          estadoRecepcion: p.recepcion
            ? "Recibido"
            : p.descargado
              ? "Pendiente recepción"
              : "N/A",
          tipoOperacion: p.vehicle?.tipoRecepcion?.nombre || "N/A",
          codigoTipoOperacion: p.vehicle?.tipoRecepcion?.codigo || undefined,
          pesoPalletEstandar:
            p.pesoPalletEstandar != null ? Number(p.pesoPalletEstandar) : null,
          pesoPalletAplicado:
            p.pesoPalletAplicado != null ? Number(p.pesoPalletAplicado) : null,
          productoConPallet: p.productoConPallet ?? null,
          pesoProductoNeto: resolvePesoProductoNetoDisplay({
            pesoTotal: Number(p.pesoTotal) || 0,
            pesoPalletAplicado:
              p.pesoPalletAplicado != null
                ? Number(p.pesoPalletAplicado)
                : null,
            productoConPallet: p.productoConPallet ?? null,
            codigoTipoOperacion: p.vehicle?.tipoRecepcion?.codigo,
          }),
        };
      });

      const excelData = exportRows.map((row: any, idx: number) => {
        const fecha = new Date(row.fecha);
        const diaSemana = fecha.toLocaleDateString("es-EC", {
          weekday: "long",
          timeZone: "America/Bogota",
        });

        return {
          "N°": idx + 1,
          Fecha: fecha.toLocaleDateString("es-EC", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            timeZone: "America/Bogota",
          }),
          "Día de la Semana": diaSemana,
          Hora: fecha.toLocaleTimeString("es-EC", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "America/Bogota",
          }),
          "Placa Vehículo": row.placa,
          "Código Trazabilidad": row.codigoTrazabilidad || "N/A",
          Operador: row.operador || "N/A",
          "Código Pallet": row.codigoPallet,
          Producto: row.productNombre || "N/A",
          "Peso Ingreso Vehículo (kg)": Number(row.pesoIngreso).toFixed(2),
          "Peso Salida Vehículo (kg)": row.pesoSalida
            ? Number(row.pesoSalida).toFixed(2)
            : "Pendiente",
          "Diferencia Vehículo (kg)": Number(row.variacion).toFixed(2),
          "Peso Pallet (kg)": Number(row.pesoTotal || 0).toFixed(2),
          "Peso Pallet Estándar (kg)":
            row.pesoPalletEstandar != null
              ? Number(row.pesoPalletEstandar).toFixed(2)
              : "N/A",
          "Peso Pallet Aplicado (kg)":
            row.pesoPalletAplicado != null
              ? Number(row.pesoPalletAplicado).toFixed(2)
              : "N/A",
          "Peso Neto Producto (kg)":
            row.pesoProductoNeto != null
              ? Number(row.pesoProductoNeto).toFixed(2)
              : "N/A",
          "Producto con Pallet":
            row.productoConPallet == null
              ? "N/A"
              : row.productoConPallet
                ? "Sí"
                : "No",
          "Tipo Operación": row.tipoOperacion || "N/A",
          "Peso Despacho Pallet (kg)": row.pesoDescarga
            ? Number(row.pesoDescarga).toFixed(2)
            : "Pendiente",
          "Variación Pallet (kg)": row.variacionPeso
            ? Number(row.variacionPeso).toFixed(2)
            : "N/A",
          "Estado Despacho": row.descargado ? "Despachado" : "Pendiente",
          "Cód. Recepción": row.codigoRecepcion || "N/A",
          "Peso Recibido (kg)":
            row.pesoRecibido != null
              ? Number(row.pesoRecibido).toFixed(2)
              : "N/A",
          "Diferencia Recepción (kg)":
            row.diferenciaRecepcion != null
              ? Number(row.diferenciaRecepcion).toFixed(2)
              : "N/A",
          "Estado Recepción": row.estadoRecepcion || "N/A",
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);

      // Ajustar anchos de columna
      ws["!cols"] = [
        { wch: 8 }, // N°
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
          <p className="mt-1 text-2xl font-semibold">{total}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-gray-400 uppercase">Peso Total Pallets</p>
          <p className="mt-1 text-2xl font-semibold">
            {totalWeight.toLocaleString()} kg
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
                <th>Tipo operación</th>
                <th>Producto</th>
                <th>Número de Pallet</th>
                <th className="text-right">Peso del Pallet</th>
                <th className="text-right">Pallet estándar</th>
                <th className="text-right">Pallet aplicado</th>
                <th className="text-right">Peso neto</th>
                <th>Con pallet</th>
                <th className="text-right">Peso de Despacho</th>
                <th className="text-right">Peso Recibido</th>
                <th className="text-right">Dif. Recepción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-10 text-gray-400">
                    No existen registros de pesaje
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition">
                    <td>{new Date(r.fecha).toLocaleString()}</td>
                    <td className="font-medium">{r.placa}</td>
                    <td>{r.tipoOperacion || "N/A"}</td>
                    <td>{r.productNombre || "N/A"}</td>
                    <td className="font-mono">{r.codigoPallet}</td>
                    <td className="text-right font-semibold">
                      {(r.pesoTotal || 0).toLocaleString()} kg
                    </td>
                    <td className="text-right">
                      {r.pesoPalletEstandar != null ? (
                        <span>{r.pesoPalletEstandar.toLocaleString()} kg</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="text-right">
                      {r.pesoPalletAplicado != null ? (
                        <span>{r.pesoPalletAplicado.toLocaleString()} kg</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="text-right">
                      {r.pesoProductoNeto != null ? (
                        <span className="font-semibold text-emerald-400">
                          {r.pesoProductoNeto.toLocaleString()} kg
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td>
                      {r.productoConPallet == null ? (
                        <span className="text-gray-500">-</span>
                      ) : r.productoConPallet ? (
                        <span>Sí</span>
                      ) : (
                        <span>No</span>
                      )}
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
                        <span
                          className={`font-semibold ${Math.abs(r.diferenciaRecepcion) > 0.01 ? "text-red-400" : "text-green-400"}`}
                        >
                          {r.diferenciaRecepcion > 0 ? "+" : ""}
                          {r.diferenciaRecepcion.toFixed(2)} kg
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLabelRow(r)}
                          title="Ver Reporte"
                          aria-label="Ver Reporte"
                          className="btn btn-ghost btn-xs"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setCambiarIngresoRow(r)}
                          title="Cambiar de Ingreso"
                          aria-label="Cambiar de Ingreso"
                          className="btn btn-ghost btn-xs"
                        >
                          <ArrowsRightLeftIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-400">
          {total > 0
            ? `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} registros`
            : "No hay registros"}
        </span>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
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
                tipoOperacion: labelRow.tipoOperacion,
                pesoPalletEstandar: labelRow.pesoPalletEstandar ?? null,
                pesoPalletAplicado: labelRow.pesoPalletAplicado ?? null,
                productoConPallet: labelRow.productoConPallet ?? null,
                pesoProductoNeto: labelRow.pesoProductoNeto ?? null,
              }
            : null
        }
        onClose={() => setLabelRow(null)}
      />

      <CambiarIngresoModal
        pallet={
          cambiarIngresoRow
            ? {
                id: cambiarIngresoRow.id,
                placa: cambiarIngresoRow.placa,
                vehicleId: cambiarIngresoRow.vehicleId,
              }
            : null
        }
        onClose={() => setCambiarIngresoRow(null)}
        onChanged={() => void load()}
      />
    </div>
  );
}
