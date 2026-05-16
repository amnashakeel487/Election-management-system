import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export async function downloadResultsPdfFromElement(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - margin * 2

  const imgHeight = (canvas.height * contentWidth) / canvas.width
  let heightLeft = imgHeight
  let position = margin

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
  heightLeft -= pageHeight - margin * 2

  while (heightLeft > 0) {
    pdf.addPage()
    position = margin - (imgHeight - heightLeft)
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  pdf.save(filename)
}

export function printResultsElement(element: HTMLElement, documentTitle: string): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    window.print()
    return
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${documentTitle.replace(/</g, '&lt;')}</title>
  <style>
    body { margin: 0; padding: 16px; font-family: 'Segoe UI', system-ui, sans-serif; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${element.outerHTML}</body>
</html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.onload = () => {
    printWindow.print()
    printWindow.onafterprint = () => printWindow.close()
  }
}
