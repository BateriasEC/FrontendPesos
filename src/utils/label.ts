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

// Genera ZPL simulado para impresoras Zebra (código de barras + texto)
export function generateZPL({ code, title }: { code: string; title?: string }) {
  return `^XA
^CF0,40
^FO50,30^FD${title || 'IMPRESION ETIQUETA'}^FS
^BY2,2,100
^FO50,100^BCN,100,Y,N,N
^FD${code}^FS
^FO50,220^ADN,36,20^FD${code}^FS
^XZ`
}


