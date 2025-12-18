import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Request, RequestFormData, RequestStatus } from '../types/request'
import { useAuth } from '../contexts/AuthContext'

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    fetchRequests().catch(err => {
      console.error('Error fetching requests:', err)
      setError(err.message)
      setLoading(false)
    })

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'requests'
      }, () => {
        fetchRequests().catch(err => {
          console.error('Error fetching requests:', err)
        })
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchRequests() {
    if (!supabase) return

    try {
      const { data, error: fetchError } = await supabase
        .from('requests')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Supabase error fetching requests:', fetchError)
        setError(fetchError.message)
      } else if (data) {
        setRequests(data as Request[])
        setError(null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function createRequest(formData: RequestFormData): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('requests')
      .insert([{ ...formData, requested_by: user?.id }])
      .select(`*, product:products(*)`)
      .single()

    if (error) throw error

    setRequests([data as Request, ...requests])
  }

  async function updateStatus(requestId: string, status: RequestStatus) {
    if (!supabase) throw new Error('Supabase not configured')

    const { error } = await supabase
      .from('requests')
      .update({
        status,
        handled_by: user?.id
      })
      .eq('id', requestId)

    if (error) throw error

    setRequests(requests.map(r =>
      r.id === requestId ? { ...r, status, handled_by: user?.id || null } : r
    ))
  }

  return {
    requests,
    loading,
    error,
    createRequest,
    updateStatus,
    fetchRequests,
  }
}
