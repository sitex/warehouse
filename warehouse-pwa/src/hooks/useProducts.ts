import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Product, ProductFormData } from '../types/product'
import { useAuth } from '../contexts/AuthContext'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchProducts = useCallback(async () => {
    const client = supabase
    if (!client) {
      setError('Supabase not configured')
      setLoading(false)
      return
    }

    setLoading(true)

    // Fetch all products with pagination (Supabase default limit is 1000)
    let allProducts: Product[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error: fetchError } = await client
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('name')
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        allProducts = [...allProducts, ...(data as Product[])]
        page++
        hasMore = data.length === pageSize
      } else {
        hasMore = false
      }
    }

    setProducts(allProducts)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchProducts()
  }, [fetchProducts])

  async function createProduct(formData: ProductFormData, photoFile?: File): Promise<Product> {
    const client = supabase
    if (!client) throw new Error('Supabase not configured')

    let photo_url: string | null = null

    // Upload photo if provided
    if (photoFile) {
      const fileName = `${Date.now()}-${photoFile.name}`
      const { data: uploadData, error: uploadError } = await client.storage
        .from('product-photos')
        .upload(fileName, photoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = client.storage
        .from('product-photos')
        .getPublicUrl(uploadData.path)

      photo_url = publicUrl
    }

    const { data, error } = await client
      .from('products')
      .insert({
        sku: formData.sku,
        name: formData.name,
        barcode: formData.barcode || null,
        brand: formData.brand || null,
        supplier: formData.supplier || null,
        quantity: formData.quantity,
        qty_per_package: formData.qty_per_package,
        location: formData.location || null,
        photo_url,
      })
      .select()
      .single()

    if (error) throw error

    const product = data as Product
    setProducts(prev => [...prev, product])
    return product
  }

  async function updateProduct(id: string, formData: Partial<ProductFormData>, photoFile?: File): Promise<Product> {
    const client = supabase
    if (!client) throw new Error('Supabase not configured')

    let photo_url: string | undefined = undefined

    if (photoFile) {
      const fileName = `${Date.now()}-${photoFile.name}`
      const { data: uploadData, error: uploadError } = await client.storage
        .from('product-photos')
        .upload(fileName, photoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = client.storage
        .from('product-photos')
        .getPublicUrl(uploadData.path)

      photo_url = publicUrl
    }

    const updatePayload: Record<string, unknown> = {}
    if (formData.name !== undefined) updatePayload.name = formData.name
    if (formData.barcode !== undefined) updatePayload.barcode = formData.barcode || null
    if (formData.brand !== undefined) updatePayload.brand = formData.brand || null
    if (formData.supplier !== undefined) updatePayload.supplier = formData.supplier || null
    if (formData.quantity !== undefined) updatePayload.quantity = formData.quantity
    if (formData.qty_per_package !== undefined) updatePayload.qty_per_package = formData.qty_per_package
    if (formData.location !== undefined) updatePayload.location = formData.location || null
    if (photo_url !== undefined) updatePayload.photo_url = photo_url

    const { data, error } = await client
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const updated = data as Product
    setProducts(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }

  async function adjustQuantity(productId: string, change: number, note?: string) {
    const client = supabase
    if (!client) throw new Error('Supabase not configured')

    const product = products.find(p => p.id === productId)
    if (!product) throw new Error('Product not found')

    const newQuantity = product.quantity + change

    // Update product quantity
    const { error: updateError } = await client
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', productId)

    if (updateError) throw updateError

    // Record in history
    const { error: historyError } = await client
      .from('inventory_history')
      .insert({
        product_id: productId,
        old_quantity: product.quantity,
        new_quantity: newQuantity,
        change_amount: change,
        note: note || null,
        user_id: user?.id || null,
      })

    if (historyError) throw historyError

    // Update local state
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, quantity: newQuantity } : p
    ))
  }

  async function toggleLowStock(productId: string) {
    const client = supabase
    if (!client) throw new Error('Supabase not configured')

    const product = products.find(p => p.id === productId)
    if (!product) throw new Error('Product not found')

    const { error } = await client
      .from('products')
      .update({ is_low_stock: !product.is_low_stock })
      .eq('id', productId)

    if (error) throw error

    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, is_low_stock: !p.is_low_stock } : p
    ))
  }

  async function deleteProduct(id: string) {
    const client = supabase
    if (!client) throw new Error('Supabase not configured')

    // Soft delete - set deleted_at timestamp
    const { error } = await client
      .from('products')
      .update({ deleted_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', id)

    if (error) throw error

    setProducts(prev => prev.filter(p => p.id !== id))
  }

  function searchProducts(term: string): Product[] {
    if (!term) return products
    const lowerTerm = term.toLowerCase()
    return products.filter(p =>
      p.sku.toLowerCase().includes(lowerTerm) ||
      p.name.toLowerCase().includes(lowerTerm) ||
      (p.barcode && p.barcode.toLowerCase().includes(lowerTerm))
    )
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    adjustQuantity,
    toggleLowStock,
    deleteProduct,
    searchProducts,
  }
}
