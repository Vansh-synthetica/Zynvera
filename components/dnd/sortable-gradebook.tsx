'use client'

import { GripVertical } from 'lucide-react'
import { PragmaticSortableList } from './sortable-list'
import type { SortableItem } from './sortable-list'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type GradeColumn = SortableItem & {
  name: string
  category: string
  maxScore: number
  weight: number
}

type StudentGrade = {
  userId: string
  name: string
  avatar?: string
  grades: Record<string, number | null>
}

type SortableGradebookProps = {
  columns: GradeColumn[]
  students: StudentGrade[]
  onReorderColumns: (columns: GradeColumn[]) => void
  readOnly?: boolean
}

function getLetterGrade(pct: number): string {
  if (pct >= 93) return 'A'
  if (pct >= 90) return 'A-'
  if (pct >= 87) return 'B+'
  if (pct >= 83) return 'B'
  if (pct >= 80) return 'B-'
  if (pct >= 77) return 'C+'
  if (pct >= 73) return 'C'
  if (pct >= 70) return 'C-'
  if (pct >= 67) return 'D+'
  if (pct >= 60) return 'D'
  return 'F'
}

function getGradeColor(pct: number): string {
  if (pct >= 90) return 'text-green-600'
  if (pct >= 80) return 'text-blue-600'
  if (pct >= 70) return 'text-yellow-600'
  if (pct >= 60) return 'text-orange-600'
  return 'text-red-600'
}

export function SortableGradebook({
  columns,
  students,
  onReorderColumns,
  readOnly,
}: SortableGradebookProps) {
  const calculateAverage = (grades: Record<string, number | null>) => {
    let total = 0
    let count = 0
    columns.forEach(col => {
      const score = grades[col.id]
      if (score !== null && score !== undefined) {
        total += (score / col.maxScore) * 100 * col.weight
        count += col.weight
      }
    })
    return count > 0 ? total / count : 0
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 font-medium text-muted-foreground sticky left-0 bg-background z-10 min-w-[180px]">
              Student
            </th>
            {columns.map((col, index) => (
              <th key={col.id} className="p-2 font-medium text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-1">
                  {!readOnly && (
                    <GripVertical className="size-3 text-muted-foreground cursor-grab" />
                  )}
                  <div>
                    <div className="text-xs">{col.name}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      /{col.maxScore} · {col.weight}%
                    </div>
                  </div>
                </div>
              </th>
            ))}
            <th className="p-2 font-medium text-center min-w-[80px]">Average</th>
            <th className="p-2 font-medium text-center min-w-[60px]">Grade</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => {
            const avg = calculateAverage(student.grades)
            return (
              <tr key={student.userId} className="border-b hover:bg-muted/30">
                <td className="p-2 sticky left-0 bg-background z-10">
                  <span className="text-sm font-medium">{student.name}</span>
                </td>
                {columns.map(col => {
                  const score = student.grades[col.id]
                  const pct = score !== null && score !== undefined ? (score / col.maxScore) * 100 : null
                  return (
                    <td key={col.id} className="p-2 text-center">
                      {score !== null && score !== undefined ? (
                        <span className={cn('text-sm', pct !== null && getGradeColor(pct))}>
                          {score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )
                })}
                <td className="p-2 text-center">
                  <span className={cn('text-sm font-medium', getGradeColor(avg))}>
                    {avg.toFixed(1)}%
                  </span>
                </td>
                <td className="p-2 text-center">
                  <Badge variant="outline" className={getGradeColor(avg)}>
                    {getLetterGrade(avg)}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export type { GradeColumn, StudentGrade }
