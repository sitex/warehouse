import ExcelJS from 'exceljs'
import type { Product, ProductFormData } from '../types/product'

// Column mapping from existing Excel file structure
const COLUMN_MAP = {
  barcode: 'A',      // Barcode
  sku: 'B',          // SKU/Product code
  supplier: 'D',     // Supplier code
  brand: 'E',        // Brand name
  name: 'G',         // Product name
  qty_per_package: 'H', // Qty per package
  quantity: 'J',     // Current quantity
}

/**
 * Parse XLSX file and extract product data
 */
export async function parseXlsxFile(file: File): Promise<ProductFormData[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)

  const products: ProductFormData[] = []

  // Try to find WAREHOUSE sheet, fallback to first sheet
  let sheet = workbook.getWorksheet('WAREHOUSE')
  if (!sheet) {
    sheet = workbook.worksheets[0]
  }

  if (!sheet) {
    throw new Error('No worksheets found in file')
  }

  // Process rows (skip header row 1)
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Skip header

    const sku = getCellValue(row, COLUMN_MAP.sku)
    const name = getCellValue(row, COLUMN_MAP.name)

    // Skip rows without SKU or name
    if (!sku || !name) return

    products.push({
      sku: String(sku).trim(),
      barcode: getCellValue(row, COLUMN_MAP.barcode)?.toString().trim() || undefined,
      name: String(name).trim(),
      brand: getCellValue(row, COLUMN_MAP.brand)?.toString().trim() || undefined,
      supplier: getCellValue(row, COLUMN_MAP.supplier)?.toString().trim() || undefined,
      quantity: parseInt(getCellValue(row, COLUMN_MAP.quantity)) || 0,
      qty_per_package: parseInt(getCellValue(row, COLUMN_MAP.qty_per_package)) || 1,
    })
  })

  return products
}

/**
 * Get cell value handling different types
 */
function getCellValue(row: ExcelJS.Row, column: string): string {
  const cell = row.getCell(column)

  if (!cell || cell.value === null || cell.value === undefined) {
    return ''
  }

  // Handle rich text
  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    return (cell.value.richText as { text: string }[]).map((r) => r.text).join('')
  }

  // Handle formula results
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    return String(cell.value.result)
  }

  return String(cell.value)
}

/**
 * Export products to XLSX file
 */
export async function exportToXlsx(products: Product[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('WAREHOUSE')

  // Set up headers
  sheet.columns = [
    { header: 'Barcode', key: 'barcode', width: 15 },
    { header: 'SKU', key: 'sku', width: 12 },
    { header: 'Supplier', key: 'supplier', width: 10 },
    { header: 'Brand', key: 'brand', width: 15 },
    { header: 'Name', key: 'name', width: 40 },
    { header: 'Qty/Package', key: 'qty_per_package', width: 12 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Location', key: 'location', width: 12 },
    { header: 'Low Stock', key: 'is_low_stock', width: 10 },
  ]

  // Style header row
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  // Add data rows
  products.forEach(product => {
    const row = sheet.addRow({
      barcode: product.barcode || '',
      sku: product.sku,
      supplier: product.supplier || '',
      brand: product.brand || '',
      name: product.name,
      qty_per_package: product.qty_per_package,
      quantity: product.quantity,
      location: product.location || '',
      is_low_stock: product.is_low_stock ? 'Yes' : 'No',
    })

    // Highlight low stock rows
    if (product.is_low_stock) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }
      }
    }
  })

  // Generate blob
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
