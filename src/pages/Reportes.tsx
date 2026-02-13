import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "../styles/report-sabanas.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { DateRange } from "../components/DateRange";
import { ReportCharts } from "../components/ReportCharts";
import { SabanaPesajes } from "../components/SabanaPesajes";
import { SabanaDespacho } from "../components/SabanaDespacho";
import { Pagination } from "../components/Pagination";
import { useReportData } from "../hooks/useReportData";
import { useSabanaData } from "../hooks/useSabanaData";

export default function Reportes() {
  const { rows, loading, load } = useReportData();
  const todayIso = new Date().toISOString().slice(0, 10);
  const weekAgoIso = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [range, setRange] = useState({ from: weekAgoIso, to: todayIso });
  const [reportRange, setReportRange] = useState({
    from: weekAgoIso,
    to: todayIso,
  });
  const [sabanaRange, setSabanaRange] = useState({
    from: weekAgoIso,
    to: todayIso,
  });
  const [sabanaPage, setSabanaPage] = useState(1);
  const [despachoPage, setDespachoPage] = useState(1);
  const [searchPesajes, setSearchPesajes] = useState('');
  const [searchDespacho, setSearchDespacho] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchingReports, setSearchingReports] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { sabanaPesajesData, sabanaDespachoData, loading: sabanaLoading } = useSabanaData(sabanaRange);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = new Date(r.fecha);
      return (
        (!reportRange.from || d >= new Date(reportRange.from + "T00:00:00")) &&
        (!reportRange.to || d <= new Date(reportRange.to + "T23:59:59"))
      );
    });
  }, [rows, reportRange]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      const day = new Date(r.fecha).toISOString().slice(0, 10);
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [filtered]);

  const deviationByProduct = useMemo(() => {
    const map = new Map<string, number[]>();
    filtered.forEach((r) => {
      const key = String(r.productoId);
      const arr = map.get(key) || [];
      arr.push(r.variacion);
      map.set(key, arr);
    });

    return Array.from(map.entries())
      .map(([product, values]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const deviation =
          values.reduce((acc, v) => acc + Math.abs(v - avg), 0) / values.length;
        return {
          product,
          avg: Number(deviation.toFixed(2)),
          promedioModelo: Number(avg.toFixed(2)),
          registros: values.length,
        };
      })
      .filter((p) => p.avg > 0);
  }, [filtered]);

  // PDF de Reportes
  const exportPDF = useCallback(() => {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      pdf.setFontSize(18);
      pdf.setTextColor(183, 28, 28);
      pdf.text("Reporte de Pesajes", 14, 15);

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `Rango de fechas: ${reportRange.from} al ${reportRange.to}`,
        14,
        23,
      );
      pdf.setFontSize(10);
      pdf.text(`Total de registros: ${filtered.length}`, 14, 30);

      autoTable(pdf, {
        startY: 36,
        head: [["Fecha", "Hora", "Variación (kg)", "Producto ID", "Cliente"]],
        body: filtered.map((r) => {
          const fecha = new Date(r.fecha);
          return [
            fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" }),
            fecha.toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Bogota",
            }),
            r.variacion,
            r.productoId,
            r.cliente || "N/A",
          ];
        }),
        styles: { fontSize: 9, cellPadding: 3, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [183, 28, 28],
          textColor: 255,
          halign: "center",
        },
        alternateRowStyles: { fillColor: [255, 243, 205] },
        columnStyles: {
          0: { halign: "center" },
          1: { halign: "center" },
          2: { halign: "right" },
          3: { halign: "center" },
          4: { halign: "left" },
        },
      });

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(
          `Página ${i} de ${pageCount}`,
          pdf.internal.pageSize.width - 30,
          pdf.internal.pageSize.height - 10,
        );
      }

      pdf.save(`reportes_${reportRange.from}_${reportRange.to}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF");
    }
  }, [filtered, reportRange]);

  // Excel de Reportes
  const exportExcel = useCallback(() => {
    try {
      const excelData = filtered.map((r, idx) => {
        const fecha = new Date(r.fecha);
        return {
          ID: idx + 1,
          Fecha: fecha,
          Hora: fecha,
          "Variación (kg)": r.variacion,
          "Producto ID": r.productoId,
          Cliente: r.cliente || "N/A",
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData, { cellDates: true });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reportes");
      XLSX.writeFile(wb, `reportes_${reportRange.from}_${reportRange.to}.xlsx`);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al exportar Excel");
    }
  }, [filtered, reportRange]);

  // Excel Sábana de Pesajes
  const exportSabanaPesajesExcel = useCallback(() => {
    try {
      const excelData: any[] = [];
      sabanaPesajesData.forEach((vehiculo, idx) => {
        vehiculo.pallets.forEach((pallet) => {
          excelData.push({
            'Vehículo': idx + 1,
            'Placa': vehiculo.placa,
            'Código Trazabilidad': vehiculo.codigoTrazabilidad,
            'Cliente': vehiculo.cliente,
            'Producto Vehículo': vehiculo.producto,
            'Fecha': vehiculo.fecha,
            'Hora Ingreso': vehiculo.horaIngreso,
            'Operador': vehiculo.operador || 'N/A',
            'Peso Ingreso (kg)': vehiculo.pesoIngreso,
            'Peso Salida (kg)': vehiculo.pesoSalida,
            'Diferencia Vehículo (kg)': vehiculo.diferencia,
            'Código Pallet': pallet.codigoIndependiente,
            'Producto Pallet': pallet.producto,
            'Peso Real (kg)': pallet.pesoReal,
            'Peso Estimado (kg)': pallet.pesoEstimado,
            'Peso Tolerado (kg)': pallet.pesoTolerado,
            'Estado Despacho': pallet.estadoDespacho === 'despachado' ? 'Despachado' : 'Pendiente de Despacho',
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sábana de Pesajes");
      XLSX.writeFile(wb, `sabana_pesajes_${sabanaRange.from}_${sabanaRange.to}.xlsx`);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al exportar Excel");
    }
  }, [sabanaPesajesData, sabanaRange]);

  // PDF Sábana de Pesajes
  const exportSabanaPesajesPDF = useCallback(() => {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      pdf.setFontSize(18);
      pdf.setTextColor(183, 28, 28);
      pdf.text("Sábana de Pesajes", 14, 15);

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `Rango de fechas: ${sabanaRange.from} al ${sabanaRange.to}`,
        14,
        23,
      );

      const tableData: any[] = [];
      sabanaPesajesData.forEach((vehiculo, idx) => {
        vehiculo.pallets.forEach((pallet, pIdx) => {
          tableData.push([
            idx + 1,
            vehiculo.placa,
            vehiculo.cliente,
            vehiculo.fecha,
            vehiculo.pesoIngreso,
            vehiculo.pesoSalida,
            vehiculo.diferencia,
            pallet.codigoIndependiente,
            pallet.pesoReal.toFixed(2),
            pallet.estadoDespacho === 'despachado' ? 'Despachado' : 'Pendiente',
          ]);
        });
      });

      autoTable(pdf, {
        startY: 30,
        head: [["Veh.", "Placa", "Cliente", "Fecha", "Peso Ing.", "Peso Sal.", "Dif.", "Código Pallet", "Peso", "Estado"]],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [183, 28, 28],
          textColor: 255,
          halign: "center",
        },
        alternateRowStyles: { fillColor: [255, 243, 205] },
      });

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(
          `Página ${i} de ${pageCount}`,
          pdf.internal.pageSize.width - 30,
          pdf.internal.pageSize.height - 10,
        );
      }

      pdf.save(`sabana_pesajes_${sabanaRange.from}_${sabanaRange.to}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF");
    }
  }, [sabanaPesajesData, sabanaRange]);

  // Excel Sábana de Despacho
  const exportSabanaDespachoExcel = useCallback(() => {
    try {
      const excelData = sabanaDespachoData.map((item, idx) => ({
        'ID': idx + 1,
        'Código Pallet': item.codigoIndependiente,
        'Placa': item.placa,
        'Cliente': item.cliente,
        'Producto': item.producto,
        'Peso Original (kg)': item.pesoOriginal,
        'Peso Despacho (kg)': item.estadoDespacho === 'completado' ? item.pesoDespacho : 'Pendiente',
        'Variación (kg)': item.estadoDespacho === 'completado' ? item.variacion : 'Pendiente',
        'Fecha Despacho': item.estadoDespacho === 'completado' ? item.fechaDespacho : 'Pendiente',
        'Hora Despacho': item.estadoDespacho === 'completado' ? item.horaDespacho : 'Pendiente',
        'Estado': item.estadoDespacho === 'completado' ? 'Completado' : 'Pendiente',
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sábana de Despacho");
      XLSX.writeFile(wb, `sabana_despacho_${sabanaRange.from}_${sabanaRange.to}.xlsx`);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al exportar Excel");
    }
  }, [sabanaDespachoData, sabanaRange]);

  // PDF Sábana de Despacho
  const exportSabanaDespachoPDF = useCallback(() => {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      pdf.setFontSize(18);
      pdf.setTextColor(183, 28, 28);
      pdf.text("Sábana de Despacho", 14, 15);

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `Rango de fechas: ${sabanaRange.from} al ${sabanaRange.to}`,
        14,
        23,
      );

      const tableData = sabanaDespachoData.map((item, idx) => [
        idx + 1,
        item.codigoIndependiente,
        item.placa,
        item.cliente,
        item.pesoOriginal.toFixed(2),
        item.estadoDespacho === 'completado' ? item.pesoDespacho.toFixed(2) : 'Pendiente',
        item.estadoDespacho === 'completado' ? item.variacion.toFixed(2) : '-',
        item.estadoDespacho === 'completado' ? item.fechaDespacho : 'Pendiente',
        item.estadoDespacho === 'completado' ? 'Completado' : 'Pendiente',
      ]);

      autoTable(pdf, {
        startY: 30,
        head: [["ID", "Código Pallet", "Placa", "Cliente", "Peso Orig.", "Peso Desp.", "Var.", "Fecha", "Estado"]],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [183, 28, 28],
          textColor: 255,
          halign: "center",
        },
        alternateRowStyles: { fillColor: [255, 243, 205] },
      });

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(
          `Página ${i} de ${pageCount}`,
          pdf.internal.pageSize.width - 30,
          pdf.internal.pageSize.height - 10,
        );
      }

      pdf.save(`sabana_despacho_${sabanaRange.from}_${sabanaRange.to}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF");
    }
  }, [sabanaDespachoData, sabanaRange]);

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold text-gray-100">Reportes</h1>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-3 items-end">
        <DateRange from={range.from} to={range.to} onChange={setRange} />
        <button
          onClick={async () => {
            setSearchingReports(true);
            setReportRange(range);
            await load();
            setTimeout(() => setSearchingReports(false), 500);
          }}
          disabled={searchingReports || loading}
          className="h-10 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded transition font-medium"

        >
          {searchingReports || loading ? (
            <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
          ) : (
            "Buscar"
          )}
        </button>
        <button
          onClick={exportPDF}
          className="h-10 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded transition font-medium"
        >
          Exportar PDF
        </button>
        <button
          onClick={exportExcel}
          className="h-10 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded transition font-medium"
        >
          Exportar Excel
        </button>
      </div>

      {/* GRÁFICOS */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 mt-4">
        <ReportCharts
          byDay={byDay}
          deviationByProduct={deviationByProduct}
          loading={loading || searchingReports}
        />
      </div>

      {/* SÁBANA DE PESAJES */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6 mt-4">
        <div className="flex flex-wrap justify-between gap-4 mb-5">
          <h2 className="text-xl font-semibold text-gray-100 pt-1">
            Sábana de Pesajes
          </h2>

          <div className="flex flex-wrap gap-2 items-end">
            <DateRange from={range.from} to={range.to} onChange={setRange} />

            <div className="flex gap-2 mt-5">
              <button
                onClick={async () => {
                  setSearching(true);
                  setSabanaRange(range);
                  setSabanaPage(1);
                  setTimeout(() => setSearching(false), 500);
                }}
                disabled={searching || sabanaLoading}
                className="h-10 px-5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white rounded-lg transition font-medium flex items-center justify-center"
              >
                {searching || sabanaLoading ? (
                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                ) : (
                  "Buscar"
                )}
              </button>

              <button
                onClick={exportSabanaPesajesExcel}
                className="h-10 px-5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium flex items-center justify-center"
              >
                Excel
              </button>

              <button
                onClick={exportSabanaPesajesPDF}
                className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium flex items-center justify-center"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por placa, cliente, código de trazabilidad o número de pallet..."
            value={searchPesajes}
            onChange={(e) => setSearchPesajes(e.target.value)}
            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        {sabanaLoading || searching ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin border-b-2 border-gray-400 rounded-full" />
          </div>
        ) : sabanaPesajesData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay datos para el rango de fechas seleccionado</p>
            <p className="text-sm mt-1 text-gray-500">
              Rango: {sabanaRange.from} a {sabanaRange.to}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-white/5">
              <SabanaPesajes
                data={sabanaPesajesData.slice((sabanaPage - 1) * 10, sabanaPage * 10)}
                searchTerm={searchPesajes}
              />
            </div>

            <div className="flex justify-end mt-4">
              <Pagination
                page={sabanaPage}
                pageSize={10}
                total={sabanaPesajesData.length}
                onChange={setSabanaPage}
              />
            </div>
          </>
        )}
      </section>

      {/* SÁBANA DE DESPACHO */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6 mt-4">
        <div className="flex flex-wrap justify-between gap-4 mb-5">
          <h2 className="text-xl font-semibold text-gray-100 pt-1">
            Sábana de Despacho
          </h2>

          <div className="flex gap-2">
            <button
              onClick={exportSabanaDespachoExcel}
              className="h-10 px-5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium flex items-center justify-center"
            >
              Excel
            </button>

            <button
              onClick={exportSabanaDespachoPDF}
              className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium flex items-center justify-center"
            >
              PDF
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por placa, cliente o número de pallet..."
            value={searchDespacho}
            onChange={(e) => setSearchDespacho(e.target.value)}
            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        {sabanaLoading || searching ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin border-b-2 border-gray-400 rounded-full" />
          </div>
        ) : sabanaDespachoData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay datos para el rango de fechas seleccionado</p>
            <p className="text-sm mt-1 text-gray-500">
              Rango: {sabanaRange.from} a {sabanaRange.to}
            </p>
          </div>
        ) : (
          <>
            <SabanaDespacho
              data={sabanaDespachoData.slice((despachoPage - 1) * 20, despachoPage * 20)}
              searchTerm={searchDespacho}
            />

            <div className="flex justify-end mt-4">
              <Pagination
                page={despachoPage}
                pageSize={20}
                total={sabanaDespachoData.length}
                onChange={setDespachoPage}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
