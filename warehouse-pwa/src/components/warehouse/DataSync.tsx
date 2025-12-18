import { useRef, useState } from 'react'
import { useXlsxSync } from '../../hooks/useXlsxSync'

export function DataSync() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importFromFile, exportToFile, importing, exporting, progress } = useXlsxSync()
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const importResult = await importFromFile(file)
      setResult(importResult)
    } catch (err) {
      alert('Failed to import file: ' + (err as Error).message)
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="font-semibold mb-4">Data Import/Export</h2>

      <div className="flex gap-4 flex-wrap">
        {/* Import */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {importing
              ? `Importing... (${progress.current}/${progress.total})`
              : 'Import from Excel'
            }
          </button>
        </div>

        {/* Export */}
        <button
          onClick={exportToFile}
          disabled={exporting}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {/* Import Result */}
      {result && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
          Import complete: {result.imported} new, {result.skipped} updated, {result.total} total
          <button
            onClick={() => setResult(null)}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
