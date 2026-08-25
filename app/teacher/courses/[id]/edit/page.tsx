'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { CourseEditor } from '@/components/teacher/course-editor'

export default function EditCoursePage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/teacher/courses/${params.id}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Edit Course</h1>
            <p className="text-sm text-muted-foreground">Changes save to the database immediately</p>
          </div>
        </div>
        <CourseEditor courseId={params.id} />
      </div>
    </AppShell>
  )
}
