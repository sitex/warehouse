import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { parseXlsxFile, exportToXlsx, downloadBlob } from '../lib/xlsx'
import { useProducts } from './useProducts'

export function useXlsxSync() {
  const { products, fetchProducts } = useProducts()
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  async function importFromFile(file: File) {
    if (!supabase) throw new Error('Supabase not configured')

    setImporting(true)
    setProgress({ current: 0, total: 0 })

    try {
      const parsedProducts = await parseXlsxFile(file)
      setProgress({ current: 0, total: parsedProducts.length })

      let imported = 0
      let skipped = 0

      for (const product of parsedProducts) {
        // Check if SKU already exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('sku', product.sku)
          .single()

        if (existing) {
          // Update existing product
          await supabase
            .from('products')
            .update(product)
            .eq('id', existing.id)
          skipped++
        } else {
          // Insert new product
          await supabase
            .from('products')
            .insert([product])
          imported++
        }

        setProgress(p => ({ ...p, current: p.current + 1 }))
      }

      await fetchProducts()

      return { imported, skipped, total: parsedProducts.length }
    } finally {
      setImporting(false)
    }
  }

  async function exportToFile() {
    setExporting(true)
    try {
      const blob = await exportToXlsx(products)
      const date = new Date().toISOString().split('T')[0]
      downloadBlob(blob, `inventory-export-${date}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  return {
    importFromFile,
    exportToFile,
    importing,
    exporting,
    progress,
  }
}
