import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchCreatorElections } from '@/services/electionService'
import type { Election } from '@/types/election'

const STORAGE_KEY = 'fv-creator-selected-election'

type CreatorElectionContextValue = {
  elections: Election[]
  loading: boolean
  selectedId: string | null
  selectedElection: Election | null
  setSelectedId: (id: string | null) => void
  refreshElections: () => Promise<void>
}

const CreatorElectionContext = createContext<CreatorElectionContextValue | null>(null)

export function CreatorElectionProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })

  const refreshElections = useCallback(async () => {
    if (!profile?.id || profile.approval_status !== 'approved') {
      setElections([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const list = await fetchCreatorElections(profile.id)
      setElections(list)
      if (list.length > 0 && selectedId && !list.some((e) => e.id === selectedId)) {
        setSelectedIdState(list[0].id)
      } else if (list.length > 0 && !selectedId) {
        setSelectedIdState(list[0].id)
      }
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.approval_status, selectedId])

  useEffect(() => {
    void refreshElections()
  }, [refreshElections])

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIdState(id)
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const selectedElection = useMemo(
    () => elections.find((e) => e.id === selectedId) ?? null,
    [elections, selectedId],
  )

  const value = useMemo(
    () => ({
      elections,
      loading,
      selectedId,
      selectedElection,
      setSelectedId,
      refreshElections,
    }),
    [elections, loading, selectedId, selectedElection, setSelectedId, refreshElections],
  )

  return <CreatorElectionContext.Provider value={value}>{children}</CreatorElectionContext.Provider>
}

export function useCreatorElection() {
  const ctx = useContext(CreatorElectionContext)
  if (!ctx) throw new Error('useCreatorElection must be used within CreatorElectionProvider')
  return ctx
}
