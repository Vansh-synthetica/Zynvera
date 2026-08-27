"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import TiptapImage from "@tiptap/extension-image"
import TiptapLink from "@tiptap/extension-link"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Highlight from "@tiptap/extension-highlight"
import TiptapUnderline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { common, createLowlight } from "lowlight"
import { useState, useCallback, useEffect, useRef } from "react"
import {
  Loader2,
  ListChecks,
  Code,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
} from "lucide-react"

const lowlight = createLowlight(common)

const extensions = [
  StarterKit.configure({
    codeBlock: false,
    paragraph: {
      HTMLAttributes: {
        class: "text-base leading-relaxed",
      },
    },
    heading: {
      levels: [1, 2, 3],
      HTMLAttributes: {
        class: "font-semibold",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "pl-6",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "pl-6",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-primary pl-4 italic text-muted-foreground",
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: "border-t border-border my-4",
      },
    },
  }),
  Placeholder.configure({
    placeholder: "Start writing...",
    emptyEditorClass: "text-muted-foreground",
  }),
  CharacterCount.configure({
    limit: 100000,
    mode: "textSize",
  }),
  TiptapImage.configure({
    HTMLAttributes: {
      class: "rounded-lg max-w-full h-auto my-4",
    },
  }),
  TiptapLink.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "underline text-primary hover:text-primary/80",
    },
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableCell,
  TableHeader,
  TaskList.configure(),
  TaskItem.configure({
    nested: true,
  }),
  Highlight.configure({
    multicolor: true,
  }),
  TiptapUnderline.configure(),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
]

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  maxChars?: number
  onWordCountChange?: (count: { words: number; chars: number }) => void
  autoSave?: (content: string) => Promise<void>
  autoSaveInterval?: number
}

export function RichTextEditor({
  value,
  onChange,
  readOnly = false,
  maxChars = 100000,
  onWordCountChange,
  autoSave,
  autoSaveInterval = 2000,
}: RichTextEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [editorWordCount, setEditorWordCount] = useState({ words: 0, chars: 0 })
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions,
    content: value,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-xl max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter(Boolean).length
      const chars = text.length

      setEditorWordCount({ words, chars })
      onWordCountChange?.({ words, chars })
      onChange(editor.getHTML())

      if (autoSave && !readOnly) {
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
        autoSaveRef.current = setTimeout(() => {
          if (!isSaving) {
            setIsSaving(true)
            autoSave(editor.getHTML())
              .then(() => {
                setLastSaved(new Date())
                setIsSaving(false)
              })
              .catch(() => setIsSaving(false))
          }
        }, autoSaveInterval)
      }
    },
    onTransaction: ({ editor }) => {
      const text = editor.getText()
      const words = text.trim().split(/\s+/).filter(Boolean).length
      const chars = text.length
      setEditorWordCount({ words, chars })
      onWordCountChange?.({ words, chars })
    },
  })

  useEffect(() => {
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (autoSave && editor) {
      setIsSaving(true)
      try {
        await autoSave(editor.getHTML())
        setLastSaved(new Date())
      } catch (e) {
        console.error("Auto-save failed:", e)
      } finally {
        setIsSaving(false)
      }
    }
  }, [autoSave, editor])

  const currentWordCount = editor?.storage.characterCount?.words() || 0
  const currentCharCount = editor?.storage.characterCount?.characters() || 0

  if (readOnly) {
    return (
      <div className="prose prose-sm sm:prose lg:prose-xl max-w-none p-4">
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div className="flex flex-col border border-border rounded-lg bg-background">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1">
          <select
            value={editor?.getAttributes("heading").level || "paragraph"}
            onChange={(e) => {
              const val = e.target.value
              if (val === "paragraph") {
                editor?.chain().focus().setParagraph().run()
              } else {
                editor?.chain().focus().setHeading({ level: Number(val) as 1 | 2 | 3 }).run()
              }
            }}
            className="text-xs px-2 py-1 border border-border rounded bg-background"
          >
            <option value="paragraph">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>

          <button onClick={() => editor?.chain().focus().toggleBold().run()} className="p-1 hover:bg-muted rounded" title="Bold (Ctrl+B)"><b className="text-sm">B</b></button>
          <button onClick={() => editor?.chain().focus().toggleItalic().run()} className="p-1 hover:bg-muted rounded" title="Italic (Ctrl+I)"><i className="text-sm">I</i></button>
          <button onClick={() => editor?.chain().focus().toggleStrike().run()} className="p-1 hover:bg-muted rounded" title="Strikethrough"><s className="text-sm">S</s></button>
          <button onClick={() => editor?.chain().focus().toggleHighlight().run()} className="p-1 hover:bg-muted rounded" title="Highlight"><span className="text-sm bg-yellow-200 px-1 rounded">H</span></button>
          <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className="p-1 hover:bg-muted rounded" title="Underline (Ctrl+U)"><u className="text-sm">U</u></button>
          <button onClick={() => editor?.chain().focus().toggleCode().run()} className="p-1 hover:bg-muted rounded" title="Inline Code"><code className="text-sm">&lt;/&gt;</code></button>

          <div className="w-px h-6 bg-border mx-1" />

          <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className="p-1 hover:bg-muted rounded" title="Bullet List"><List className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="p-1 hover:bg-muted rounded" title="Numbered List"><ListOrdered className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} className="p-1 hover:bg-muted rounded" title="Quote"><Quote className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().setCodeBlock().run()} className="p-1 hover:bg-muted rounded" title="Code Block"><Code className="size-4" /></button>

          <div className="w-px h-6 bg-border mx-1" />

          <button onClick={() => editor?.chain().focus().setTextAlign("left").run()} className="p-1 hover:bg-muted rounded" title="Align Left"><AlignLeft className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().setTextAlign("center").run()} className="p-1 hover:bg-muted rounded" title="Align Center"><AlignCenter className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().setTextAlign("right").run()} className="p-1 hover:bg-muted rounded" title="Align Right"><AlignRight className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().setTextAlign("justify").run()} className="p-1 hover:bg-muted rounded" title="Justify"><AlignJustify className="size-4" /></button>

          <div className="w-px h-6 bg-border mx-1" />

          <button onClick={() => editor?.chain().focus().toggleLink().run()} className="p-1 hover:bg-muted rounded" title="Link"><LinkIcon className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().setImage({ src: prompt("Image URL:") || "" }).run()} className="p-1 hover:bg-muted rounded" title="Image"><ImageIcon className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-1 hover:bg-muted rounded" title="Table"><TableIcon className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().toggleTaskList().run()} className="p-1 hover:bg-muted rounded" title="Task List"><ListChecks className="size-4" /></button>

          <div className="w-px h-6 bg-border mx-1" />

          <button onClick={() => editor?.chain().focus().undo().run()} className="p-1 hover:bg-muted rounded" title="Undo (Ctrl+Z)"><Undo className="size-4" /></button>
          <button onClick={() => editor?.chain().focus().redo().run()} className="p-1 hover:bg-muted rounded" title="Redo (Ctrl+Y)"><Redo className="size-4" /></button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{editorWordCount.words} words</span>
          <span>{editorWordCount.chars} chars</span>
          {maxChars && (
            <span className={editorWordCount.chars > maxChars ? "text-destructive" : ""}>
              / {maxChars} chars
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {isSaving && <Loader2 className="size-3 animate-spin text-primary" />}
            {lastSaved && !isSaving && (
              <span className="text-green-600">Saved {lastSaved.toLocaleTimeString()}</span>
            )}
            {!isSaving && !lastSaved && <span className="text-muted-foreground">Not saved</span>}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between px-2 py-1 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <span>Words: {currentWordCount}</span>
        <span>Chars: {currentCharCount}</span>
        {maxChars && <span className={currentCharCount > maxChars ? "text-destructive" : ""}>/ {maxChars}</span>}
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 className="size-3 animate-spin text-primary" />}
          {lastSaved && !isSaving && <span className="text-green-600">Saved just now</span>}
          {!isSaving && !lastSaved && <span className="text-muted-foreground">Not saved</span>}
        </div>
      </div>
    </div>
  )
}
