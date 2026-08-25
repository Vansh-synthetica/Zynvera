'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { CourseEditor } from '@/components/teacher/course-editor'

export default function NewCoursePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/teacher/courses" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Create Course</h1>
            <p className="text-sm text-muted-foreground">
              Details, curriculum, resources, syllabus and grade weights
            </p>
          </div>
        </div>
        <CourseEditor />
      </div>
    </AppShell>
  )
}
