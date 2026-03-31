'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useEffect, useCallback } from 'react'

interface Props {
  value: string
  onChange: (html: string) => void
}

const BTN: React.CSSProperties = {
  background: 'none',
  border: '1.5px solid #EDE8FF',
  borderRadius: 6,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 13,
  color: '#3D2B8A',
  fontFamily: 'var(--font-nunito)',
  lineHeight: 1,
}

const BTN_ACTIVE: React.CSSProperties = {
  ...BTN,
  background: '#7C5CFC',
  color: '#fff',
  borderColor: '#7C5CFC',
}

export default function RichEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: [
          'min-height:180px',
          'padding:14px 16px',
          'outline:none',
          'font-size:15px',
          'line-height:1.7',
          'color:#2D1F6E',
          'font-family:Arial,sans-serif',
        ].join(';'),
      },
    },
  })

  // Sync external value reset (e.g. after modal close)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  const addLink = useCallback(() => {
    const url = window.prompt('URL ссылки')
    if (!url) return
    editor?.chain().focus().setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div style={{ border: '1.5px solid #EDE8FF', borderRadius: 10, overflow: 'hidden', background: '#FAF8FF' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 4, flexWrap: 'wrap',
        padding: '8px 10px', borderBottom: '1px solid #EDE8FF', background: '#F8F5FF',
      }}>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          style={editor.isActive('bold') ? BTN_ACTIVE : BTN}
          title="Жирный (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          style={editor.isActive('italic') ? BTN_ACTIVE : BTN}
          title="Курсив (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <div style={{ width: 1, background: '#EDE8FF', margin: '2px 4px' }} />
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
          style={editor.isActive('heading', { level: 2 }) ? BTN_ACTIVE : BTN}
          title="Заголовок H2"
        >
          H2
        </button>
        <div style={{ width: 1, background: '#EDE8FF', margin: '2px 4px' }} />
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
          style={editor.isActive('bulletList') ? BTN_ACTIVE : BTN}
          title="Маркированный список"
        >
          • список
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
          style={editor.isActive('orderedList') ? BTN_ACTIVE : BTN}
          title="Нумерованный список"
        >
          1. список
        </button>
        <div style={{ width: 1, background: '#EDE8FF', margin: '2px 4px' }} />
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); addLink() }}
          style={editor.isActive('link') ? BTN_ACTIVE : BTN}
          title="Вставить ссылку"
        >
          🔗
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetAllMarks().clearNodes().run() }}
          style={BTN}
          title="Убрать форматирование"
        >
          ✕ формат
        </button>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      <style>{`
        .tiptap p { margin: 0 0 12px; }
        .tiptap h2 { font-size: 18px; font-weight: 800; color: #3D2B8A; margin: 16px 0 10px; }
        .tiptap ul, .tiptap ol { margin: 0 0 12px; padding-left: 22px; }
        .tiptap li { margin: 0 0 4px; }
        .tiptap a { color: #7C5CFC; text-decoration: underline; }
        .tiptap:focus-within { outline: none; }
        .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  )
}
