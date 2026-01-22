import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "../styles/report-sabanas.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DateRange } from "../components/DateRange";
import { ReportCharts } from "../components/ReportCharts";
import { SabanasTable } from "../components/SabanasTable";
import { Pagination } from "../components/Pagination";
import { useReportData } from "../hooks/useReportData";
import { useSabanaData } from "../hooks/useSabanaData";
import * as XLSX from "xlsx";
import autoTable from "jspdf-autotable";

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
  const [searching, setSearching] = useState(false);
  const [searchingReports, setSearchingReports] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { sabanasData, loading: sabanaLoading } = useSabanaData(sabanaRange);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const d = new Date(r.fecha);
        const okFrom =
          !reportRange.from || d >= new Date(reportRange.from + "T00:00:00");
        const okTo =
          !reportRange.to || d <= new Date(reportRange.to + "T23:59:59");
        return okFrom && okTo;
      }),
    [rows, reportRange],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      const k = new Date(r.fecha).toISOString().slice(0, 10);
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [filtered]);

  const deviationByProduct = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    filtered.forEach((r) => {
      const key = String(r.productoId);
      const current = map.get(key) || { sum: 0, count: 0 };
      current.sum += Math.abs(r.variacion);
      current.count += 1;
      map.set(key, current);
    });
    return Array.from(map.entries())
      .map(([product, data]) => ({
        product: product || "N/A",
        avg: data.count > 0 ? Number((data.sum / data.count).toFixed(2)) : 0,
      }))
      .filter((p) => p.product !== "N/A" && p.avg > 0);
  }, [filtered]);

  const exportPDF = useCallback(() => {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      /* =========================
       ENCABEZADO
    ========================== */
      pdf.setFontSize(18);
      pdf.setTextColor(183, 28, 28); // 🔴 rojo fuerte
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

      /* =========================
       TABLA PRINCIPAL
    ========================== */
      autoTable(pdf, {
        startY: 36,
        head: [["Fecha", "Hora", "Variación (kg)", "Producto ID", "Cliente"]],
        body: filtered.map((r) => {
          const fecha = new Date(r.fecha);
          return [
            fecha.toLocaleDateString("es-CO", {
              timeZone: "America/Bogota",
            }),
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
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [40, 40, 40],
        },
        headStyles: {
          fillColor: [183, 28, 28], // 🔴 rojo
          textColor: 255,
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [255, 243, 205], // 🟡 amarillo suave
        },
        columnStyles: {
          0: { halign: "center" }, // Fecha
          1: { halign: "center" }, // Hora
          2: { halign: "right" }, // Variación
          3: { halign: "center" }, // Producto
          4: { halign: "left" }, // Cliente
        },
      });

      /* =========================
       PIE DE PÁGINA
    ========================== */
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

  const exportExcel = useCallback(() => {
    try {
      /* =========================
       DATOS BASE
    ========================== */
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

      const ws = XLSX.utils.json_to_sheet(excelData, {
        cellDates: true,
      });

      /* =========================
       FORMATO DE CELDAS
    ========================== */
      const range = XLSX.utils.decode_range(ws["!ref"] as string);

      for (let R = range.s.r + 1; R <= range.e.r; R++) {
        // Fecha
        ws[XLSX.utils.encode_cell({ r: R, c: 1 })].z = "dd/mm/yyyy";
        // Hora
        ws[XLSX.utils.encode_cell({ r: R, c: 2 })].z = "hh:mm";
        // Variación numérica
        ws[XLSX.utils.encode_cell({ r: R, c: 3 })].t = "n";
      }

      /* =========================
       FILA DE TOTALES
    ========================== */
      const totalRow = range.e.r + 1;
      ws[XLSX.utils.encode_cell({ r: totalRow, c: 2 })] = {
        t: "s",
        v: "TOTAL",
      };
      ws[XLSX.utils.encode_cell({ r: totalRow, c: 3 })] = {
        t: "n",
        f: `SUM(D2:D${range.e.r + 1})`,
      };

      ws["!ref"] = XLSX.utils.encode_range({
        s: range.s,
        e: { r: totalRow, c: range.e.c },
      });

      /* =========================
       ANCHO DE COLUMNAS
    ========================== */
      ws["!cols"] = [
        { wch: 6 }, // ID
        { wch: 12 }, // Fecha
        { wch: 10 }, // Hora
        { wch: 16 }, // Variación
        { wch: 14 }, // Producto
        { wch: 22 }, // Cliente
      ];

      /* =========================
       FILTROS Y CONGELAR HEADER
    ========================== */
      ws["!autofilter"] = { ref: ws["!ref"] };
      ws["!freeze"] = { xSplit: 0, ySplit: 1 };

      /* =========================
       LIBRO
    ========================== */
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reportes");

      XLSX.writeFile(wb, `reportes_${reportRange.from}_${reportRange.to}.xlsx`);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al exportar Excel. Por favor, intente nuevamente.");
    }
  }, [filtered, reportRange]);

  const exportSabanaExcel = useCallback(() => {
    try {
      /* =========================
       DATOS BASE
    ========================== */
      const excelData: any[] = [];

      sabanasData.forEach((camion, idx) => {
        camion.paletes.forEach((palet, pIdx) => {
          const trit = camion.trituradora[pIdx] || {};
          const fecha = new Date(camion.fecha);

          excelData.push({
            Camión: idx + 1,
            Placa: camion.placa,
            "Código Trazabilidad": camion.codigoTrazabilidad || "N/A",
            Cliente: camion.cliente || "N/A",
            Producto: palet.producto || camion.producto || "N/A",
            Fecha: fecha,
            "Hora Ingreso": camion.horaIngreso,
            "Peso Antes (kg)": camion.pesoAntes ?? null,
            "Peso Después (kg)": camion.pesoDespues ?? null,
            "Diferencia Camión (kg)": camion.diferencia ?? null,
            Pallet: palet.numero,
            "Peso Real Pallet (kg)": palet.pesoReal ?? null,
            "Peso Estimado Pallet (kg)": palet.pesoEstimado ?? null,
            "Peso Tolerado Pallet (kg)": palet.pesoTolerado ?? null,
            "Estado Pallet": palet.estado === "ok" ? "OK" : "Error",
            "Peso Pallet Triturado (kg)": trit.pesoPalet ?? null,
            "Peso Triturado (kg)":
              trit.pesoTriturado > 0 ? trit.pesoTriturado : null,
            "Diferencia Triturado (kg)":
              trit.pesoTriturado > 0 ? trit.diferencia : null,
            "Estado Triturado":
              trit.pesoTriturado > 0
                ? trit.estado === "ok"
                  ? "OK"
                  : "Error"
                : "Pendiente",
            "Producto Triturado": trit.producto || camion.producto || "N/A",
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(excelData, { cellDates: true });

      /* =========================
       FORMATO DE CELDAS
    ========================== */
      const range = XLSX.utils.decode_range(ws["!ref"] as string);

      for (let R = range.s.r + 1; R <= range.e.r; R++) {
        ws[XLSX.utils.encode_cell({ r: R, c: 5 })].z = "dd/mm/yyyy"; // Fecha
        ws[XLSX.utils.encode_cell({ r: R, c: 6 })].z = "hh:mm"; // Hora
      }

      /* =========================
       FILA DE TOTALES
    ========================== */
      const totalRow = range.e.r + 1;

      ws[XLSX.utils.encode_cell({ r: totalRow, c: 4 })] = {
        t: "s",
        v: "TOTALES",
      };

      ws[XLSX.utils.encode_cell({ r: totalRow, c: 7 })] = {
        t: "n",
        f: `SUM(H2:H${range.e.r + 1})`,
      };
      ws[XLSX.utils.encode_cell({ r: totalRow, c: 8 })] = {
        t: "n",
        f: `SUM(I2:I${range.e.r + 1})`,
      };
      ws[XLSX.utils.encode_cell({ r: totalRow, c: 9 })] = {
        t: "n",
        f: `SUM(J2:J${range.e.r + 1})`,
      };

      ws["!ref"] = XLSX.utils.encode_range({
        s: range.s,
        e: { r: totalRow, c: range.e.c },
      });

      /* =========================
       COLUMNAS
    ========================== */
      ws["!cols"] = [
        { wch: 8 }, // Camión
        { wch: 12 }, // Placa
        { wch: 22 }, // Código
        { wch: 20 }, // Cliente
        { wch: 20 }, // Producto
        { wch: 12 }, // Fecha
        { wch: 12 }, // Hora
        { wch: 16 }, // Peso Antes
        { wch: 16 }, // Peso Después
        { wch: 18 }, // Diferencia Camión
        { wch: 10 }, // Pallet
        { wch: 18 }, // Peso Real
        { wch: 20 }, // Peso Estimado
        { wch: 20 }, // Peso Tolerado
        { wch: 16 }, // Estado Pallet
        { wch: 20 }, // Peso Pallet Triturado
        { wch: 18 }, // Peso Triturado
        { wch: 20 }, // Diferencia Triturado
        { wch: 18 }, // Estado Triturado
        { wch: 22 }, // Producto Triturado
      ];

      /* =========================
       FILTRO Y HEADER FIJO
    ========================== */
      ws["!autofilter"] = { ref: ws["!ref"] };
      ws["!freeze"] = { xSplit: 0, ySplit: 1 };

      /* =========================
       LIBRO
    ========================== */
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sábanas de Pesajes");

      XLSX.writeFile(
        wb,
        `sabanas_pesajes_${sabanaRange.from}_${sabanaRange.to}.xlsx`,
      );
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al exportar Excel");
    }
  }, [sabanasData, sabanaRange]);

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold mb-4">Reportes</h1>
      <div className="flex items-end gap-3">
        <DateRange from={range.from} to={range.to} onChange={setRange} />
        <button
          onClick={async () => {
            setSearchingReports(true);
            setReportRange(range);
            // Recargar datos si es necesario
            await load();
            setTimeout(() => setSearchingReports(false), 500);
          }}
          disabled={searchingReports || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded transition-colors duration-200 whitespace-nowrap flex items-center gap-2"
        >
          {searchingReports || loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Buscando...</span>
            </>
          ) : (
            <>
              <span>🔍</span> Buscar
            </>
          )}
        </button>
      </div>

      <section className="flex items-center gap-2">
        <button
          onClick={exportPDF}
          disabled={loading || searchingReports}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded transition-colors duration-200 whitespace-nowrap flex items-center gap-2"
        >
          <span>📄</span> Exportar PDF
        </button>
        <button
          onClick={exportExcel}
          disabled={loading || searchingReports || filtered.length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium rounded transition-colors duration-200 whitespace-nowrap flex items-center gap-2"
        >
          <span>📊</span> Exportar Excel
        </button>
      </section>

      <div ref={ref}>
        <ReportCharts
          byDay={byDay}
          deviationByProduct={deviationByProduct}
          loading={loading || searchingReports}
        />
      </div>

      <section className="report-sabanas bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">Sábanas de pesajes</h2>
          <div className="flex items-end gap-3">
            <DateRange from={range.from} to={range.to} onChange={setRange} />
            <button
              onClick={async () => {
                setSearching(true);
                setSabanaRange(range);
                setSabanaPage(1);
                // Esperar un momento para que el hook se actualice
                setTimeout(() => setSearching(false), 500);
              }}
              disabled={searching || sabanaLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded transition-colors duration-200 whitespace-nowrap flex items-center gap-2"
            >
              {searching || sabanaLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <span>🔍</span> Buscar
                </>
              )}
            </button>
            <button
              onClick={exportSabanaExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors duration-200 whitespace-nowrap flex items-center gap-2"
            >
              <span>📊</span> Exportar Excel
            </button>
          </div>
        </div>

        {sabanaLoading || searching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white/60">Cargando datos...</p>
            </div>
          </div>
        ) : sabanasData.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-lg">
              No hay datos para el rango de fechas seleccionado
            </p>
            <p className="text-sm mt-2 text-white/40">
              Rango: {sabanaRange.from} a {sabanaRange.to}
            </p>
          </div>
        ) : (
          <>
            <SabanasTable
              data={sabanasData.slice((sabanaPage - 1) * 10, sabanaPage * 10)}
            />
            <div className="mt-6 flex justify-end">
              <Pagination
                page={sabanaPage}
                pageSize={10}
                total={sabanasData.length}
                onChange={setSabanaPage}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
