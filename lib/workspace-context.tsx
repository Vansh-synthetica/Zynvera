'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UserRole, Workspace, VerificationStatus } from '@/types'
import { institutions, academicTerms, currentUser } from '@/lib/seed'

type WorkspaceContextType = {
  workspace: Workspace | null
  setWorkspace: (w: Workspace) => void
  clearWorkspace: () => void
  institution: typeof institutions[0] | null
  institutionId: string | null
  term: typeof academicTerms[0] | null
  role: UserRole
  setRole: (role: UserRole) => void
  userName: string
  setUserName: (name: string) => void
  userId: string | null
  verificationStatus: VerificationStatus
  setVerificationStatus: (status: VerificationStatus) => void
  isVerified: boolean
  isPending: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

const STORAGE_KEY = 'zynvera-workspace'
const VERIFICATION_KEY = 'zynvera-verification'

function loadWorkspace(): Workspace | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Workspace
  } catch {
    return null
  }
}

function loadVerification(): VerificationStatus {
  if (typeof window === 'undefined') return 'unverified'
  try {
    return (window.localStorage.getItem(VERIFICATION_KEY) as VerificationStatus) || 'unverified'
  } catch {
    return 'unverified'
  }
}

function saveWorkspaceToStorage(w: Workspace) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(w))
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null)
  const [verificationStatus, setVerificationStatusState] = useState<VerificationStatus>('unverified')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setWorkspaceState(loadWorkspace())
    setVerificationStatusState(loadVerification())
    setHydrated(true)
  }, [])

  const setWorkspace = useCallback((w: Workspace) => {
    setWorkspaceState(w)
    saveWorkspaceToStorage(w)
  }, [])

  const clearWorkspace = useCallback(() => {
    setWorkspaceState(null)
    setVerificationStatusState('unverified')
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(VERIFICATION_KEY)
  }, [])

  const setRole = useCallback((role: UserRole) => {
    setWorkspaceState(prev => {
      if (!prev) return prev
      const next = { ...prev, role }
      saveWorkspaceToStorage(next)
      return next
    })
  }, [])

  const setUserName = useCallback((userName: string) => {
    setWorkspaceState(prev => {
      if (!prev) return prev
      const next = { ...prev, userName }
      saveWorkspaceToStorage(next)
      return next
    })
  }, [])

  const setVerificationStatus = useCallback((status: VerificationStatus) => {
    setVerificationStatusState(status)
    window.localStorage.setItem(VERIFICATION_KEY, status)
  }, [])

  const institution = workspace ? institutions.find(i => i.id === workspace.institutionId) ?? institutions[0] : null
  const term = workspace ? academicTerms.find(t => t.institutionId === workspace.institutionId && t.status === 'active') ?? academicTerms[0] : null

  if (!hydrated) return null

  return (
    <WorkspaceContext.Provider value={{
      workspace, setWorkspace, clearWorkspace,
      institution,
      institutionId: workspace?.institutionId ?? null,
      term,
      role: workspace?.role ?? 'student',
      setRole, userName: workspace?.userName ?? currentUser.name, setUserName,
      userId: workspace?.userId ?? null,
      verificationStatus, setVerificationStatus,
      isVerified: verificationStatus === 'verified',
      isPending: verificationStatus === 'pending',
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
