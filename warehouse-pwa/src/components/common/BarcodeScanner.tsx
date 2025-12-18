import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode('barcode-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      (decodedText) => {
        // Success - barcode detected
        scanner.stop()
        onScan(decodedText)
      },
      () => {
        // Ignore scan failures (no barcode in frame)
      }
    ).catch(err => {
      setError('Camera access denied or not available')
      console.error('Scanner error:', err)
    })

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white text-2xl"
        >
          &times;
        </button>

        <div id="barcode-reader" className="w-full h-full" />

        {error && (
          <div className="absolute bottom-20 left-0 right-0 text-center text-white bg-red-600 p-4">
            {error}
          </div>
        )}

        <div className="absolute bottom-4 left-0 right-0 text-center text-white">
          Point camera at barcode
        </div>
      </div>
    </div>
  )
}
