import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportElementPNG(el: HTMLElement, filename = 'etiqueta.png') {
  const canvas = await html2canvas(el)
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename
  link.click()
}

export async function exportElementPDF(el: HTMLElement, filename = 'etiqueta.pdf') {
  const canvas = await html2canvas(el)
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] })
  pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(filename)
}

// Genera ZPL para etiqueta de pallet 10 x 7 cm (203 DPI)
export function generateZPL(data: {
  code: string;
  title?: string;
  peso?: number;
  material?: string;
  canal?: string;
  placa?: string;
  fecha?: string;
  hora?: string;
  codigoCompleto?: string;
  placaSecuencial?: string;
}) {
  const pesoStr = data.peso != null
    ? data.peso.toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : '';

  const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/\^/g, '\\^').replace(/~/g, '\\~');
  const codigo = esc(data.code);
  const material = esc(data.material || 'N/A');
  const canal = esc(data.canal || 'N/A');
  const placa = esc(data.placa || 'N/A');
  const fecha = esc(data.fecha || '');
  const hora = esc(data.hora || '');
  const secuencial = data.placaSecuencial ? esc(data.placaSecuencial) : '';
  const codigoCompleto = data.codigoCompleto && data.codigoCompleto !== data.code
    ? esc(data.codigoCompleto)
    : '';

  return `^XA
^PW799
^LL559
^CI28
^FO20,12^A0N,34,34^FD${esc(data.title || 'BATERIAS EC')}^FS
^FO480,12^A0N,26,26^FDPESO^FS
^FO300,42^FB479,1,0,R,0^A0N,80,80^FD${pesoStr} kg^FS
^FO20,68^A0N,24,24^FDMATERIAL:^FS
^FO170,66^FB609,1,0,L,0^A0N,32,32^FD${material}^FS
^FO20,112^A0N,22,22^FDCANAL:^FS
^FO115,110^FB280,1,0,L,0^A0N,28,28^FD${canal}^FS
^FO420,112^A0N,22,22^FDPLACA:^FS
^FO510,110^FB269,1,0,L,0^A0N,28,28^FD${placa}^FS
^FO20,158^A0N,24,24^FD${fecha}  ${hora}^FS
${secuencial ? `^FO20,228^A0N,30,30^FDPALLET: ${secuencial}^FS` : ''}
^FO60,285^BY3,3,115^BCN,115,Y,N,N^FD${codigo}^FS
^FO0,430^FB799,1,0,C,0^A0N,42,42^FD${codigo}^FS
${codigoCompleto ? `^FO0,490^FB799,1,0,C,0^A0N,20,20^FD${codigoCompleto}^FS` : ''}
^XZ`;
}


