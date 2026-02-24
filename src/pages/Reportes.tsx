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
  const [activeTab, setActiveTab] = useState<'pesajes' | 'despacho'>('pesajes');
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
    const map = new Map<string, { count: number; peso: number }>();
    filtered.forEach((r) => {
      const day = new Date(r.fecha).toISOString().slice(0, 10);
      const current = map.get(day) || { count: 0, peso: 0 };
      current.count += 1;
      current.peso += Math.abs(r.variacion || 0);
      map.set(day, current);
    });
    return Array.from(map.entries())
      .map(([day, data]) => ({ 
        day, 
        total: data.count,
        peso: Number(data.peso.toFixed(2))
      }))
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
      
      // Encabezado
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
      pdf.text(
        `Fecha de generación: ${new Date().toLocaleString('es-EC')}`,
        14,
        36,
      );

      autoTable(pdf, {
        startY: 42,
        head: [["ID", "Fecha", "Hora", "Día", "Variación (kg)", "Producto ID", "Cliente"]],
        body: filtered.map((r, idx) => {
          const fecha = new Date(r.fecha);
          return [
            idx + 1,
            fecha.toLocaleDateString("es-EC", { 
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              timeZone: "America/Bogota" 
            }),
            fecha.toLocaleTimeString("es-EC", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZone: "America/Bogota",
            }),
            fecha.toLocaleDateString("es-EC", { 
              weekday: 'short',
              timeZone: "America/Bogota" 
            }),
            Number(r.variacion).toFixed(2),
            r.productoId,
            r.cliente || "N/A",
          ];
        }),
        styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [183, 28, 28],
          textColor: 255,
          halign: "center",
          fontSize: 9,
        },
        alternateRowStyles: { fillColor: [255, 243, 205] },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { halign: "center", cellWidth: 25 },
          2: { halign: "center", cellWidth: 22 },
          3: { halign: "center", cellWidth: 18 },
          4: { halign: "right", cellWidth: 25 },
          5: { halign: "center", cellWidth: 25 },
          6: { halign: "left", cellWidth: 'auto' },
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
          'ID': idx + 1,
          'Fecha': fecha.toLocaleDateString('es-EC', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            timeZone: 'America/Bogota'
          }),
          'Hora': fecha.toLocaleTimeString('es-EC', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            timeZone: 'America/Bogota'
          }),
          'Día de la Semana': fecha.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' }),
          'Variación (kg)': Number(r.variacion).toFixed(2),
          'Producto ID': r.productoId,
          'Cliente': r.cliente || 'N/A',
          'Rango de Consulta': `${reportRange.from} al ${reportRange.to}`,
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 8 },  // ID
        { wch: 12 }, // Fecha
        { wch: 12 }, // Hora
        { wch: 15 }, // Día
        { wch: 15 }, // Variación
        { wch: 15 }, // Producto ID
        { wch: 30 }, // Cliente
        { wch: 30 }, // Rango
      ];
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reportes');
      XLSX.writeFile(wb, `reportes_${reportRange.from}_${reportRange.to}.xlsx`);
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("Error al exportar Excel");
    }
  }, [filtered, reportRange]);

  // Excel Reporte General Consolidado
  const exportReporteGeneralExcel = useCallback(() => {
    try {
      const wb = XLSX.utils.book_new();
      
      const fechaGeneracion = new Date().toLocaleString('es-EC', { timeZone: 'America/Bogota' });

      // Hoja 1: Resumen General
      const resumenData = [
        { '': 'REPORTE GENERAL CONSOLIDADO', ' ': '' },
        { '': 'Fecha de Generación', ' ': fechaGeneracion },
        { '': 'Rango de Consulta', ' ': `${sabanaRange.from} al ${sabanaRange.to}` },
        { '': '', ' ': '' },
        { '': 'MÉTRICAS GENERALES', ' ': '' },
        { '': 'Total de Vehículos Procesados', ' ': sabanaPesajesData.length },
        { '': 'Total de Pallets Creados', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.pallets.length, 0) },
        { '': 'Total de Pallets Despachados', ' ': sabanaDespachoData.filter(d => d.estadoDespacho === 'completado').length },
        { '': 'Total de Pallets Pendientes', ' ': sabanaDespachoData.filter(d => d.estadoDespacho !== 'completado').length },
        { '': '', ' ': '' },
        { '': 'PESOS Y DIFERENCIAS', ' ': '' },
        { '': 'Peso Total Ingresado (kg)', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.pesoIngreso, 0).toFixed(2) },
        { '': 'Peso Total Salida (kg)', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.pesoSalida, 0).toFixed(2) },
        { '': 'Diferencia Total Vehículos (kg)', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.diferencia, 0).toFixed(2) },
        { '': 'Peso Total Pallets (kg)', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.pallets.reduce((sum, p) => sum + p.pesoReal, 0), 0).toFixed(2) },
        { '': 'Promedio Peso por Pallet (kg)', ' ': (sabanaPesajesData.reduce((acc, v) => acc + v.pallets.reduce((sum, p) => sum + p.pesoReal, 0), 0) / Math.max(1, sabanaPesajesData.reduce((acc, v) => acc + v.pallets.length, 0))).toFixed(2) },
      ];
      const wsResumen = XLSX.utils.json_to_sheet(resumenData, { skipHeader: true });
      wsResumen['!cols'] = [{ wch: 40 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen General');

      // Hoja 2: Detalle de Vehículos y Pallets
      const detalleData: any[] = [];
      sabanaPesajesData.forEach((vehiculo, idx) => {
        const fechaCompleta = new Date(`${vehiculo.fecha}T${vehiculo.horaIngreso}`);
        const diaSemana = fechaCompleta.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' });
        
        vehiculo.pallets.forEach((pallet, pIdx) => {
          detalleData.push({
            'N° Vehículo': idx + 1,
            'N° Pallet': pIdx + 1,
            'Fecha': vehiculo.fecha,
            'Hora Ingreso': vehiculo.horaIngreso,
            'Día de la Semana': diaSemana,
            'Placa': vehiculo.placa,
            'Código Trazabilidad': vehiculo.codigoTrazabilidad,
            'Cliente': vehiculo.cliente,
            'Tipo Vehículo': vehiculo.tipoVehiculo || 'N/A',
            'Producto Vehículo': vehiculo.producto,
            'Operador': vehiculo.operador || 'N/A',
            'Peso Ingreso Vehículo (kg)': Number(vehiculo.pesoIngreso).toFixed(2),
            'Peso Salida Vehículo (kg)': Number(vehiculo.pesoSalida).toFixed(2),
            'Diferencia Vehículo (kg)': Number(vehiculo.diferencia).toFixed(2),
            'Diferencia Vehículo %': vehiculo.pesoIngreso > 0 ? ((vehiculo.diferencia / vehiculo.pesoIngreso) * 100).toFixed(2) + '%' : '0%',
            'Código Pallet': pallet.codigoIndependiente,
            'Producto Pallet': pallet.producto,
            'Peso Real Pallet (kg)': Number(pallet.pesoReal).toFixed(2),
            'Peso Estimado Pallet (kg)': Number(pallet.pesoEstimado).toFixed(2),
            'Peso Tolerado Pallet (kg)': Number(pallet.pesoTolerado).toFixed(2),
            'Diferencia vs Estimado (kg)': (pallet.pesoReal - pallet.pesoEstimado).toFixed(2),
            'Diferencia vs Estimado %': pallet.pesoEstimado > 0 ? (((pallet.pesoReal - pallet.pesoEstimado) / pallet.pesoEstimado) * 100).toFixed(2) + '%' : '0%',
            'Estado Despacho': pallet.estadoDespacho === 'despachado' ? 'Despachado' : 'Pendiente',
          });
        });
      });
      const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
      wsDetalle['!cols'] = Array(23).fill({ wch: 18 });
      XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Completo');

      // Hoja 3: Despachos
      const despachoData = sabanaDespachoData.map((item, idx) => {
        let diaDespacho = 'Pendiente';
        if (item.estadoDespacho === 'completado' && item.fechaDespacho) {
          try {
            const fechaObj = new Date(`${item.fechaDespacho}T${item.horaDespacho || '00:00:00'}`);
            if (!isNaN(fechaObj.getTime())) {
              diaDespacho = fechaObj.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' });
            }
          } catch (e) {}
        }
        
        return {
          'ID': idx + 1,
          'Fecha Despacho': item.estadoDespacho === 'completado' ? item.fechaDespacho : 'Pendiente',
          'Hora Despacho': item.estadoDespacho === 'completado' ? item.horaDespacho : 'Pendiente',
          'Día de la Semana': diaDespacho,
          'Código Pallet': item.codigoIndependiente,
          'Placa': item.placa,
          'Cliente': item.cliente,
          'Producto': item.producto,
          'Peso Original (kg)': Number(item.pesoOriginal).toFixed(2),
          'Peso Despacho (kg)': item.estadoDespacho === 'completado' ? Number(item.pesoDespacho).toFixed(2) : 'Pendiente',
          'Variación (kg)': item.estadoDespacho === 'completado' ? Number(item.variacion).toFixed(2) : 'Pendiente',
          'Variación %': item.estadoDespacho === 'completado' ? ((item.variacion / item.pesoOriginal) * 100).toFixed(2) + '%' : 'Pendiente',
          'Estado': item.estadoDespacho === 'completado' ? 'Completado' : 'Pendiente',
        };
      });
      const wsDespacho = XLSX.utils.json_to_sheet(despachoData);
      wsDespacho['!cols'] = Array(13).fill({ wch: 18 });
      XLSX.utils.book_append_sheet(wb, wsDespacho, 'Despachos');

      // Hoja 4: Análisis por Cliente
      const clienteMap = new Map<string, { vehiculos: number; pallets: number; pesoTotal: number; despachados: number; pendientes: number }>();
      sabanaPesajesData.forEach(v => {
        const cliente = v.cliente;
        const current = clienteMap.get(cliente) || { vehiculos: 0, pallets: 0, pesoTotal: 0, despachados: 0, pendientes: 0 };
        current.vehiculos += 1;
        current.pallets += v.pallets.length;
        current.pesoTotal += v.pallets.reduce((sum, p) => sum + p.pesoReal, 0);
        current.despachados += v.pallets.filter(p => p.estadoDespacho === 'despachado').length;
        current.pendientes += v.pallets.filter(p => p.estadoDespacho !== 'despachado').length;
        clienteMap.set(cliente, current);
      });
      const clienteData = Array.from(clienteMap.entries())
        .sort((a, b) => b[1].pesoTotal - a[1].pesoTotal)
        .map(([cliente, data], idx) => ({
          'Ranking': idx + 1,
          'Cliente': cliente,
          'Vehículos': data.vehiculos,
          'Pallets Totales': data.pallets,
          'Pallets Despachados': data.despachados,
          'Pallets Pendientes': data.pendientes,
          '% Despachado': data.pallets > 0 ? ((data.despachados / data.pallets) * 100).toFixed(2) + '%' : '0%',
          'Peso Total (kg)': data.pesoTotal.toFixed(2),
          'Promedio por Pallet (kg)': (data.pesoTotal / data.pallets).toFixed(2),
          'Promedio por Vehículo (kg)': (data.pesoTotal / data.vehiculos).toFixed(2),
        }));
      const wsCliente = XLSX.utils.json_to_sheet(clienteData);
      wsCliente['!cols'] = Array(10).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(wb, wsCliente, 'Análisis por Cliente');

      // Hoja 5: Análisis por Producto
      const productoMap = new Map<string, { pallets: number; pesoTotal: number; despachados: number; pendientes: number }>();
      sabanaPesajesData.forEach(v => {
        v.pallets.forEach(p => {
          const producto = p.producto;
          const current = productoMap.get(producto) || { pallets: 0, pesoTotal: 0, despachados: 0, pendientes: 0 };
          current.pallets += 1;
          current.pesoTotal += p.pesoReal;
          if (p.estadoDespacho === 'despachado') {
            current.despachados += 1;
          } else {
            current.pendientes += 1;
          }
          productoMap.set(producto, current);
        });
      });
      const productoData = Array.from(productoMap.entries())
        .sort((a, b) => b[1].pesoTotal - a[1].pesoTotal)
        .map(([producto, data], idx) => ({
          'Ranking': idx + 1,
          'Producto': producto,
          'Pallets Totales': data.pallets,
          'Pallets Despachados': data.despachados,
          'Pallets Pendientes': data.pendientes,
          '% Despachado': data.pallets > 0 ? ((data.despachados / data.pallets) * 100).toFixed(2) + '%' : '0%',
          'Peso Total (kg)': data.pesoTotal.toFixed(2),
          'Promedio por Pallet (kg)': (data.pesoTotal / data.pallets).toFixed(2),
          '% del Total': sabanaPesajesData.reduce((acc, v) => acc + v.pallets.reduce((sum, p) => sum + p.pesoReal, 0), 0) > 0 
            ? ((data.pesoTotal / sabanaPesajesData.reduce((acc, v) => acc + v.pallets.reduce((sum, p) => sum + p.pesoReal, 0), 0)) * 100).toFixed(2) + '%' 
            : '0%',
        }));
      const wsProducto = XLSX.utils.json_to_sheet(productoData);
      wsProducto['!cols'] = Array(9).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(wb, wsProducto, 'Análisis por Producto');

      // Hoja 6: Análisis Temporal
      const fechaMap = new Map<string, { vehiculos: number; pallets: number; pesoTotal: number }>();
      sabanaPesajesData.forEach(v => {
        const fecha = v.fecha;
        const current = fechaMap.get(fecha) || { vehiculos: 0, pallets: 0, pesoTotal: 0 };
        current.vehiculos += 1;
        current.pallets += v.pallets.length;
        current.pesoTotal += v.pallets.reduce((sum, p) => sum + p.pesoReal, 0);
        fechaMap.set(fecha, current);
      });
      const temporalData = Array.from(fechaMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([fecha, data]) => {
          const fechaObj = new Date(fecha);
          const diaSemana = fechaObj.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' });
          
          return {
            'Fecha': fecha,
            'Día de la Semana': diaSemana,
            'Vehículos': data.vehiculos,
            'Pallets': data.pallets,
            'Peso Total (kg)': data.pesoTotal.toFixed(2),
            'Promedio por Vehículo (kg)': (data.pesoTotal / data.vehiculos).toFixed(2),
            'Promedio por Pallet (kg)': (data.pesoTotal / data.pallets).toFixed(2),
          };
        });
      const wsTemporal = XLSX.utils.json_to_sheet(temporalData);
      wsTemporal['!cols'] = Array(7).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(wb, wsTemporal, 'Análisis Temporal');

  // Excel Reporte General Consolidado
  const exportReporteGeneralExcel = useCallback(() => {
    try {
      const wb = XLSX.utils.book_new();
      
      const fechaGeneracion = new Date().toLocaleString('es-EC', { timeZone: 'America/Bogota' });

      // Hoja 1: Resumen General
      const resumenData = [
        { '': 'REPORTE GENERAL CONSOLIDADO', ' ': '' },
        { '': 'Fecha de Generación', ' ': fechaGeneracion },
        { '': 'Rango de Consulta', ' ': `${sabanaRange.from} al ${sabanaRange.to}` },
        { '': '', ' ': '' },
        { '': 'MÉTRICAS GENERALES', ' ': '' },
        { '': 'Total de Vehículos Procesados', ' ': sabanaPesajesData.length },
        { '': 'Total de Pallets Creados', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.pallets.length, 0) },
        { '': 'Total de Pallets Despachados', ' ': sabanaDespachoData.filter(d => d.estadoDespacho === 'completado').length },
        { '': 'Total de Pallets Pendientes', ' ': sabanaDespachoData.filter(d => d.estadoDespacho !== 'completado').length },
        { '': '', ' ': '' },
        { '': 'PESOS Y DIFERENCIAS', ' ': '' },
        { '': 'Peso Total Ingresado (kg)', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.pesoIngreso, 0).toFixed(2) },
        { '': 'Peso Total Salida (kg)', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.pesoSalida, 0).toFixed(2) },
        { '': 'Diferencia Total Vehículos (kg)', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.diferencia, 0).toFixed(2) },
        { '': 'Peso Total Pallets (kg)', ' ': sabanaPesajesData.reduce((acc, v) => acc + v.pallets.reduce((sum, p) => sum + p.pesoReal, 0), 0).toFixed(2) },
        { '': 'Promedio Peso por Pallet (kg)', ' ': (sabanaPesajesData.reduce((acc, v) => acc + v.pallets.reduce((sum, p) => sum + p.pesoReal, 0), 0) / Math.max(1, sabanaPesajesData.reduce((acc, v) => acc + v.pallets.length, 0))).toFixed(2) },
      ];
      const wsResumen = XLSX.utils.json_to_sheet(resumenData, { skipHeader: true });
      wsResumen['!cols'] = [{ wch: 40 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen General');

      // Hoja 2: Vehículos
      const vehiculosData = sabanaPesajesData.map((vehiculo, idx) => {
        const fechaObj = new Date(vehiculo.fecha + 'T00:00:00');
        const diaSemana = fechaObj.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' });
        
        return {
          'N°': idx + 1,
          'Fecha': vehiculo.fecha,
          'Día de la Semana': diaSemana,
          'Hora Ingreso': vehiculo.horaIngreso,
          'Placa': vehiculo.placa,
          'Código Trazabilidad': vehiculo.codigoTrazabilidad,
          'Cliente': vehiculo.cliente,
          'Producto': vehiculo.producto,
          'Operador': vehiculo.operador || 'N/A',
          'Peso Ingreso (kg)': Number(vehiculo.pesoIngreso).toFixed(2),
          'Peso Salida (kg)': Number(vehiculo.pesoSalida).toFixed(2),
          'Diferencia (kg)': Number(vehiculo.diferencia).toFixed(2),
          'Diferencia %': vehiculo.pesoIngreso > 0 ? ((vehiculo.diferencia / vehiculo.pesoIngreso) * 100).toFixed(2) + '%' : '0%',
          'Cantidad Pallets': vehiculo.pallets.length,
        };
      });
      const wsVehiculos = XLSX.utils.json_to_sheet(vehiculosData);
      wsVehiculos['!cols'] = [
        { wch: 8 },  // N°
        { wch: 12 }, // Fecha
        { wch: 15 }, // Día
        { wch: 12 }, // Hora
        { wch: 12 }, // Placa
        { wch: 25 }, // Código
        { wch: 30 }, // Cliente
        { wch: 25 }, // Producto
        { wch: 20 }, // Operador
        { wch: 18 }, // Peso Ingreso
        { wch: 18 }, // Peso Salida
        { wch: 18 }, // Diferencia
        { wch: 15 }, // Diferencia %
        { wch: 15 }, // Cantidad Pallets
      ];
      XLSX.utils.book_append_sheet(wb, wsVehiculos, 'Vehículos');

      // Hoja 3: Pallets
      const palletsData: any[] = [];
      sabanaPesajesData.forEach((vehiculo) => {
        const fechaObj = new Date(vehiculo.fecha + 'T00:00:00');
        const diaSemana = fechaObj.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' });
        
        vehiculo.pallets.forEach((pallet) => {
          palletsData.push({
            'Código Pallet': pallet.codigoIndependiente,
            'Fecha': vehiculo.fecha,
            'Día de la Semana': diaSemana,
            'Hora': vehiculo.horaIngreso,
            'Placa Vehículo': vehiculo.placa,
            'Cliente': vehiculo.cliente,
            'Producto': pallet.producto,
            'Peso Real (kg)': Number(pallet.pesoReal).toFixed(2),
            'Peso Estimado (kg)': Number(pallet.pesoEstimado).toFixed(2),
            'Peso Tolerado (kg)': Number(pallet.pesoTolerado).toFixed(2),
            'Diferencia vs Estimado (kg)': (pallet.pesoReal - pallet.pesoEstimado).toFixed(2),
            'Diferencia %': pallet.pesoEstimado > 0 ? (((pallet.pesoReal - pallet.pesoEstimado) / pallet.pesoEstimado) * 100).toFixed(2) + '%' : '0%',
            'Estado Despacho': pallet.estadoDespacho === 'despachado' ? 'Despachado' : 'Pendiente',
          });
        });
      });
      const wsPallets = XLSX.utils.json_to_sheet(palletsData);
      wsPallets['!cols'] = [
        { wch: 30 }, // Código Pallet
        { wch: 12 }, // Fecha
        { wch: 15 }, // Día
        { wch: 12 }, // Hora
        { wch: 12 }, // Placa
        { wch: 30 }, // Cliente
        { wch: 25 }, // Producto
        { wch: 18 }, // Peso Real
        { wch: 18 }, // Peso Estimado
        { wch: 18 }, // Peso Tolerado
        { wch: 22 }, // Diferencia
        { wch: 15 }, // Diferencia %
        { wch: 18 }, // Estado
      ];
      XLSX.utils.book_append_sheet(wb, wsPallets, 'Pallets');

      // Hoja 4: Despachos
      const despachoData = sabanaDespachoData.map((item, idx) => {
        let diaDespacho = 'Pendiente';
        if (item.estadoDespacho === 'completado' && item.fechaDespacho) {
          try {
            const fechaObj = new Date(item.fechaDespacho + 'T00:00:00');
            if (!isNaN(fechaObj.getTime())) {
              diaDespacho = fechaObj.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' });
            }
          } catch (e) {
            console.error('Error parseando fecha despacho:', e);
          }
        }
        
        return {
          'N°': idx + 1,
          'Código Pallet': item.codigoIndependiente,
          'Fecha Despacho': item.estadoDespacho === 'completado' ? item.fechaDespacho : 'Pendiente',
          'Día de la Semana': diaDespacho,
          'Hora Despacho': item.estadoDespacho === 'completado' ? item.horaDespacho : 'Pendiente',
          'Placa': item.placa,
          'Cliente': item.cliente,
          'Producto': item.producto,
          'Peso Original (kg)': Number(item.pesoOriginal).toFixed(2),
          'Peso Despacho (kg)': item.estadoDespacho === 'completado' ? Number(item.pesoDespacho).toFixed(2) : 'Pendiente',
          'Variación (kg)': item.estadoDespacho === 'completado' ? Number(item.variacion).toFixed(2) : 'Pendiente',
          'Variación %': item.estadoDespacho === 'completado' ? ((item.variacion / item.pesoOriginal) * 100).toFixed(2) + '%' : 'Pendiente',
          'Estado': item.estadoDespacho === 'completado' ? 'Completado' : 'Pendiente',
        };
      });
      const wsDespacho = XLSX.utils.json_to_sheet(despachoData);
      wsDespacho['!cols'] = [
        { wch: 8 },  // N°
        { wch: 30 }, // Código Pallet
        { wch: 15 }, // Fecha
        { wch: 15 }, // Día
        { wch: 15 }, // Hora
        { wch: 12 }, // Placa
        { wch: 30 }, // Cliente
        { wch: 25 }, // Producto
        { wch: 18 }, // Peso Original
        { wch: 18 }, // Peso Despacho
        { wch: 15 }, // Variación
        { wch: 15 }, // Variación %
        { wch: 12 }, // Estado
      ];
      XLSX.utils.book_append_sheet(wb, wsDespacho, 'Despachos');

      // Hoja 5: Análisis por Producto
      const productoMap = new Map<string, { pallets: number; pesoTotal: number; despachados: number; pendientes: number }>();
      sabanaPesajesData.forEach(v => {
        v.pallets.forEach(p => {
          const producto = p.producto;
          const current = productoMap.get(producto) || { pallets: 0, pesoTotal: 0, despachados: 0, pendientes: 0 };
          current.pallets += 1;
          current.pesoTotal += p.pesoReal;
          if (p.estadoDespacho === 'despachado') {
            current.despachados += 1;
          } else {
            current.pendientes += 1;
          }
          productoMap.set(producto, current);
        });
      });
      const productoData = Array.from(productoMap.entries())
        .sort((a, b) => b[1].pesoTotal - a[1].pesoTotal)
        .map(([producto, data], idx) => ({
          'Ranking': idx + 1,
          'Producto': producto,
          'Pallets Totales': data.pallets,
          'Pallets Despachados': data.despachados,
          'Pallets Pendientes': data.pendientes,
          '% Despachado': data.pallets > 0 ? ((data.despachados / data.pallets) * 100).toFixed(2) + '%' : '0%',
          'Peso Total (kg)': data.pesoTotal.toFixed(2),
          'Promedio por Pallet (kg)': (data.pesoTotal / data.pallets).toFixed(2),
          '% del Total': sabanaPesajesData.reduce((acc, v) => acc + v.pallets.reduce((sum, p) => sum + p.pesoReal, 0), 0) > 0 
            ? ((data.pesoTotal / sabanaPesajesData.reduce((acc, v) => acc + v.pallets.reduce((sum, p) => sum + p.pesoReal, 0), 0)) * 100).toFixed(2) + '%' 
            : '0%',
        }));
      const wsProducto = XLSX.utils.json_to_sheet(productoData);
      wsProducto['!cols'] = Array(9).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(wb, wsProducto, 'Análisis por Producto');

      // Hoja 6: Análisis Temporal
      const fechaMap = new Map<string, { vehiculos: number; pallets: number; pesoTotal: number }>();
      sabanaPesajesData.forEach(v => {
        const fecha = v.fecha;
        const current = fechaMap.get(fecha) || { vehiculos: 0, pallets: 0, pesoTotal: 0 };
        current.vehiculos += 1;
        current.pallets += v.pallets.length;
        current.pesoTotal += v.pallets.reduce((sum, p) => sum + p.pesoReal, 0);
        fechaMap.set(fecha, current);
      });
      const temporalData = Array.from(fechaMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([fecha, data]) => {
          const fechaObj = new Date(fecha + 'T00:00:00');
          const diaSemana = fechaObj.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' });
          
          return {
            'Fecha': fecha,
            'Día de la Semana': diaSemana,
            'Vehículos': data.vehiculos,
            'Pallets': data.pallets,
            'Peso Total (kg)': data.pesoTotal.toFixed(2),
            'Promedio por Vehículo (kg)': (data.pesoTotal / data.vehiculos).toFixed(2),
            'Promedio por Pallet (kg)': (data.pesoTotal / data.pallets).toFixed(2),
          };
        });
      const wsTemporal = XLSX.utils.json_to_sheet(temporalData);
      wsTemporal['!cols'] = Array(7).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(wb, wsTemporal, 'Análisis Temporal');

      XLSX.writeFile(wb, `reporte_general_${sabanaRange.from}_${sabanaRange.to}.xlsx`);
    } catch (error) {
      console.error("Error al exportar Reporte General:", error);
      alert("Error al exportar Reporte General");
    }
  }, [sabanaPesajesData, sabanaDespachoData, sabanaRange]);

  // Excel Sábana de Pesajes
  const exportSabanaPesajesExcel = useCallback(() => {
    try {
      const excelData: any[] = [];
      
      sabanaPesajesData.forEach((vehiculo, idx) => {
        vehiculo.pallets.forEach((pallet, palletIdx) => {
          const fechaObj = new Date(vehiculo.fecha + 'T00:00:00');
          const diaSemana = fechaObj.toLocaleDateString('es-EC', { weekday: 'long', timeZone: 'America/Bogota' });
          
          excelData.push({
            'N° Vehículo': idx + 1,
            'N° Pallet': palletIdx + 1,
            'Fecha': vehiculo.fecha,
            'Día de la Semana': diaSemana,
            'Hora Ingreso': vehiculo.horaIngreso,
            'Placa': vehiculo.placa,
            'Código Trazabilidad': vehiculo.codigoTrazabilidad,
            'Cliente': vehiculo.cliente,
            'Producto Vehículo': vehiculo.producto,
            'Operador': vehiculo.operador || 'N/A',
            'Peso Ingreso Vehículo (kg)': Number(vehiculo.pesoIngreso).toFixed(2),
            'Peso Salida Vehículo (kg)': Number(vehiculo.pesoSalida).toFixed(2),
            'Diferencia Vehículo (kg)': Number(vehiculo.diferencia).toFixed(2),
            'Código Pallet': pallet.codigoIndependiente,
            'Producto Pallet': pallet.producto,
            'Peso Real Pallet (kg)': Number(pallet.pesoReal).toFixed(2),
            'Peso Estimado Pallet (kg)': Number(pallet.pesoEstimado).toFixed(2),
            'Peso Tolerado Pallet (kg)': Number(pallet.pesoTolerado).toFixed(2),
            'Diferencia vs Estimado (kg)': (pallet.pesoReal - pallet.pesoEstimado).toFixed(2),
            'Estado Despacho': pallet.estadoDespacho === 'despachado' ? 'Despachado' : 'Pendiente de Despacho',
            'Rango de Consulta': `${sabanaRange.from} al ${sabanaRange.to}`,
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 12 }, // N° Vehículo
        { wch: 10 }, // N° Pallet
        { wch: 12 }, // Fecha
        { wch: 15 }, // Día
        { wch: 12 }, // Hora Ingreso
        { wch: 12 }, // Placa
        { wch: 25 }, // Código Trazabilidad
        { wch: 30 }, // Cliente
        { wch: 25 }, // Producto Vehículo
        { wch: 20 }, // Operador
        { wch: 22 }, // Peso Ingreso
        { wch: 22 }, // Peso Salida
        { wch: 22 }, // Diferencia
        { wch: 30 }, // Código Pallet
        { wch: 25 }, // Producto Pallet
        { wch: 22 }, // Peso Real
        { wch: 22 }, // Peso Estimado
        { wch: 22 }, // Peso Tolerado
        { wch: 22 }, // Diferencia vs Estimado
        { wch: 22 }, // Estado Despacho
        { wch: 30 }, // Rango
      ];
      
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
      
      pdf.setFontSize(10);
      pdf.text(
        `Fecha de generación: ${new Date().toLocaleString('es-EC')}`,
        14,
        29,
      );
      pdf.text(
        `Total vehículos: ${sabanaPesajesData.length} | Total pallets: ${sabanaPesajesData.reduce((acc, v) => acc + v.pallets.length, 0)}`,
        14,
        35,
      );

      const tableData: any[] = [];
      sabanaPesajesData.forEach((vehiculo, idx) => {
        const fechaCompleta = new Date(`${vehiculo.fecha}T${vehiculo.horaIngreso}`);
        const diaSemana = fechaCompleta.toLocaleDateString('es-EC', { weekday: 'short', timeZone: 'America/Bogota' });
        
        vehiculo.pallets.forEach((pallet, pIdx) => {
          tableData.push([
            idx + 1,
            vehiculo.placa,
            vehiculo.cliente,
            vehiculo.fecha,
            vehiculo.horaIngreso,
            diaSemana,
            Number(vehiculo.pesoIngreso).toFixed(2),
            Number(vehiculo.pesoSalida).toFixed(2),
            Number(vehiculo.diferencia).toFixed(2),
            pallet.codigoIndependiente,
            Number(pallet.pesoReal).toFixed(2),
            pallet.estadoDespacho === 'despachado' ? 'Despachado' : 'Pendiente',
          ]);
        });
      });

      autoTable(pdf, {
        startY: 41,
        head: [["Veh.", "Placa", "Cliente", "Fecha", "Hora", "Día", "P.Ing.", "P.Sal.", "Dif.", "Cód.Pallet", "Peso", "Estado"]],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 1.5, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [183, 28, 28],
          textColor: 255,
          halign: "center",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [255, 243, 205] },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { halign: "center", cellWidth: 18 },
          2: { halign: "left", cellWidth: 35 },
          3: { halign: "center", cellWidth: 20 },
          4: { halign: "center", cellWidth: 15 },
          5: { halign: "center", cellWidth: 15 },
          6: { halign: "right", cellWidth: 18 },
          7: { halign: "right", cellWidth: 18 },
          8: { halign: "right", cellWidth: 15 },
          9: { halign: "left", cellWidth: 35 },
          10: { halign: "right", cellWidth: 18 },
          11: { halign: "center", cellWidth: 20 },
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

      pdf.save(`sabana_pesajes_${sabanaRange.from}_${sabanaRange.to}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF");
    }
  }, [sabanaPesajesData, sabanaRange]);

  // Excel Sábana de Despacho
  const exportSabanaDespachoExcel = useCallback(() => {
    try {
      const excelData = sabanaDespachoData.map((item, idx) => {
        let diaDespacho = 'Pendiente';
        
        if (item.estadoDespacho === 'completado' && item.fechaDespacho) {
          try {
            const fechaObj = new Date(item.fechaDespacho + 'T00:00:00');
            if (!isNaN(fechaObj.getTime())) {
              diaDespacho = fechaObj.toLocaleDateString('es-EC', { 
                weekday: 'long', 
                timeZone: 'America/Bogota' 
              });
            }
          } catch (e) {
            console.error('Error parseando fecha:', e);
          }
        }
        
        return {
          'N°': idx + 1,
          'Código Pallet': item.codigoIndependiente,
          'Fecha Despacho': item.estadoDespacho === 'completado' ? item.fechaDespacho : 'Pendiente',
          'Día de la Semana': diaDespacho,
          'Hora Despacho': item.estadoDespacho === 'completado' ? item.horaDespacho : 'Pendiente',
          'Placa': item.placa,
          'Cliente': item.cliente,
          'Producto': item.producto,
          'Peso Original (kg)': Number(item.pesoOriginal).toFixed(2),
          'Peso Despacho (kg)': item.estadoDespacho === 'completado' ? Number(item.pesoDespacho).toFixed(2) : 'Pendiente',
          'Variación (kg)': item.estadoDespacho === 'completado' ? Number(item.variacion).toFixed(2) : 'Pendiente',
          'Variación %': item.estadoDespacho === 'completado' ? ((item.variacion / item.pesoOriginal) * 100).toFixed(2) + '%' : 'Pendiente',
          'Estado': item.estadoDespacho === 'completado' ? 'Completado' : 'Pendiente',
          'Rango de Consulta': `${sabanaRange.from} al ${sabanaRange.to}`,
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 8 },  // N°
        { wch: 30 }, // Código Pallet
        { wch: 15 }, // Fecha Despacho
        { wch: 15 }, // Día
        { wch: 15 }, // Hora Despacho
        { wch: 12 }, // Placa
        { wch: 30 }, // Cliente
        { wch: 25 }, // Producto
        { wch: 18 }, // Peso Original
        { wch: 18 }, // Peso Despacho
        { wch: 15 }, // Variación
        { wch: 15 }, // Variación %
        { wch: 12 }, // Estado
        { wch: 30 }, // Rango
      ];
      
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
      
      pdf.setFontSize(10);
      pdf.text(
        `Fecha de generación: ${new Date().toLocaleString('es-EC')}`,
        14,
        29,
      );
      
      const completados = sabanaDespachoData.filter(d => d.estadoDespacho === 'completado').length;
      const pendientes = sabanaDespachoData.length - completados;
      pdf.text(
        `Total: ${sabanaDespachoData.length} | Completados: ${completados} | Pendientes: ${pendientes}`,
        14,
        35,
      );

      const tableData = sabanaDespachoData.map((item, idx) => {
        let diaDespacho = '-';
        if (item.estadoDespacho === 'completado' && item.fechaDespacho) {
          try {
            const fechaObj = new Date(`${item.fechaDespacho}T${item.horaDespacho || '00:00:00'}`);
            if (!isNaN(fechaObj.getTime())) {
              diaDespacho = fechaObj.toLocaleDateString('es-EC', { weekday: 'short', timeZone: 'America/Bogota' });
            }
          } catch (e) {}
        }
        
        return [
          idx + 1,
          item.codigoIndependiente,
          item.placa,
          item.cliente,
          Number(item.pesoOriginal).toFixed(2),
          item.estadoDespacho === 'completado' ? Number(item.pesoDespacho).toFixed(2) : 'Pend.',
          item.estadoDespacho === 'completado' ? Number(item.variacion).toFixed(2) : '-',
          item.estadoDespacho === 'completado' ? item.fechaDespacho : 'Pend.',
          item.estadoDespacho === 'completado' ? item.horaDespacho : '-',
          diaDespacho,
          item.estadoDespacho === 'completado' ? 'OK' : 'Pend.',
        ];
      });

      autoTable(pdf, {
        startY: 41,
        head: [["ID", "Cód.Pallet", "Placa", "Cliente", "P.Orig.", "P.Desp.", "Var.", "Fecha", "Hora", "Día", "Est."]],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 1.5, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [183, 28, 28],
          textColor: 255,
          halign: "center",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [255, 243, 205] },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          1: { halign: "left", cellWidth: 40 },
          2: { halign: "center", cellWidth: 18 },
          3: { halign: "left", cellWidth: 35 },
          4: { halign: "right", cellWidth: 18 },
          5: { halign: "right", cellWidth: 18 },
          6: { halign: "right", cellWidth: 15 },
          7: { halign: "center", cellWidth: 20 },
          8: { halign: "center", cellWidth: 15 },
          9: { halign: "center", cellWidth: 15 },
          10: { halign: "center", cellWidth: 15 },
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

      pdf.save(`sabana_despacho_${sabanaRange.from}_${sabanaRange.to}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF");
    }
  }, [sabanaDespachoData, sabanaRange]);

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold text-gray-100">Reportes</h1>

      {/* REPORTE GENERAL CONSOLIDADO */}
      <section className="rounded-xl border-2 border-brand-orange/50 bg-gradient-to-br from-brand-orange/10 to-transparent p-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <svg className="w-7 h-7 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reporte General Consolidado
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Exporta todos los datos en un solo archivo Excel con múltiples hojas de análisis
            </p>
          </div>

          <button
            onClick={exportReporteGeneralExcel}
            disabled={sabanaLoading || sabanaPesajesData.length === 0}
            className="h-12 px-6 bg-brand-orange hover:bg-brand-orange/90 disabled:bg-gray-500 text-white rounded-lg transition font-bold text-lg shadow-lg flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Reporte General
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <div className="text-xs text-gray-400 mb-1">Vehículos Procesados</div>
            <div className="text-2xl font-bold text-white">{sabanaPesajesData.length}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <div className="text-xs text-gray-400 mb-1">Pallets Totales</div>
            <div className="text-2xl font-bold text-white">
              {sabanaPesajesData.reduce((acc, v) => acc + v.pallets.length, 0)}
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <div className="text-xs text-gray-400 mb-1">Pallets Despachados</div>
            <div className="text-2xl font-bold text-green-400">
              {sabanaDespachoData.filter(d => d.estadoDespacho === 'completado').length}
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <div className="text-xs text-gray-400 mb-1">Peso Total (kg)</div>
            <div className="text-2xl font-bold text-brand-orange">
              {sabanaPesajesData.reduce((acc, v) => acc + v.pallets.reduce((sum, p) => sum + p.pesoReal, 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-200">
              <strong>El reporte incluye:</strong> Resumen general, detalle completo de vehículos y pallets, 
              información de despachos, análisis por cliente y análisis por producto. Todo con fechas, horas y métricas detalladas.
            </div>
          </div>
        </div>
      </section>

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

      {/* SÁBANAS CON TABS */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-6 mt-4">
        {/* Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pesajes')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'pesajes'
                  ? 'bg-brand-orange text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Sábana de Pesajes
            </button>
            <button
              onClick={() => setActiveTab('despacho')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'despacho'
                  ? 'bg-brand-orange text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Sábana de Despacho
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-end">
            <DateRange from={range.from} to={range.to} onChange={setRange} />

            <button
              onClick={async () => {
                setSearching(true);
                setSabanaRange(range);
                setSabanaPage(1);
                setDespachoPage(1);
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

            {activeTab === 'pesajes' ? (
              <>
                <button
                  onClick={exportSabanaPesajesExcel}
                  className="h-10 px-5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                >
                  Excel
                </button>
                <button
                  onClick={exportSabanaPesajesPDF}
                  className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                >
                  PDF
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={exportSabanaDespachoExcel}
                  className="h-10 px-5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                >
                  Excel
                </button>
                <button
                  onClick={exportSabanaDespachoPDF}
                  className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                >
                  PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content - Sábana de Pesajes */}
        {activeTab === 'pesajes' && (
          <>
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
          </>
        )}

        {/* Tab Content - Sábana de Despacho */}
        {activeTab === 'despacho' && (
          <>
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
          </>
        )}
      </section>
    </div>
  );
}
