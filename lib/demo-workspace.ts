export type DemoRole = 'student' | 'teacher' | 'principal' | 'admin'

export type Institution = {
  id: string
  name: string
  type: 'School' | 'University'
  city: string
  students: number
  approved: boolean
  focus: string
}

export type DemoWorkspace = {
  institutionId: string
  role: DemoRole
  userName: string
  joinedAt: string
}

export const approvedInstitutions: Institution[] = [
  { id: 'riverside', name: 'Riverside Academy', type: 'School', city: 'Birmingham, UK', students: 1284, approved: true, focus: 'STEM & Humanities' },
  { id: 'northstar', name: 'Northstar University', type: 'University', city: 'Toronto, Canada', students: 8400, approved: true, focus: 'Research & Innovation' },
  { id: 'greenfield', name: 'Greenfield College', type: 'School', city: 'Austin, USA', students: 962, approved: true, focus: 'Arts & Sciences' },
]

export const demoMetrics = {
  riverside: { attendance: 94, average: 82, activeClasses: 18, atRisk: 34 },
  northstar: { attendance: 91, average: 78, activeClasses: 64, atRisk: 218 },
  greenfield: { attendance: 96, average: 86, activeClasses: 14, atRisk: 17 },
} as const

export const demoCourses = [
  { id: 'math', title: 'Mathematics & Problem Solving', teacher: 'Dr. Sarah Johnson', progress: 76, next: 'Quadratic functions', color: 'teal' },
  { id: 'physics', title: 'Physics: Energy & Motion', teacher: 'Prof. Michael Chen', progress: 48, next: 'Lab: momentum', color: 'coral' },
  { id: 'history', title: 'Modern World History', teacher: 'Ms. Emily Rodriguez', progress: 92, next: 'Final reflection', color: 'gold' },
]

const KEY = 'zynvera-demo-workspace'

export function getWorkspace(): DemoWorkspace | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) as DemoWorkspace : null
  } catch { return null }
}

export function saveWorkspace(workspace: DemoWorkspace) {
  window.localStorage.setItem(KEY, JSON.stringify(workspace))
  window.dispatchEvent(new CustomEvent('zynvera-workspace-change'))
}

export function clearWorkspace() {
  window.localStorage.removeItem(KEY)
  window.dispatchEvent(new CustomEvent('zynvera-workspace-change'))
}

export function getInstitution(id: string) {
  return approvedInstitutions.find((institution) => institution.id === id) ?? approvedInstitutions[0]
}

export const roleLabels: Record<DemoRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  principal: 'Principal',
  admin: 'School administrator',
}

export const roleDescriptions: Record<DemoRole, string> = {
  student: 'Learn, track progress, and stay connected.',
  teacher: 'Monitor classrooms, assignments, and learner support.',
  principal: 'See institution-wide outcomes and leadership signals.',
  admin: 'Manage people, programmes, and institution settings.',
}

export function formatRole(role: DemoRole) { return roleLabels[role] }
export { KEY as DEMO_WORKSPACE_KEY }
