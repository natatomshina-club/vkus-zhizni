'use client'

import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (html: string) => void
}

const BTN: React.CSSProperties = {
  padding: '4px 10px', border: '1px solid #DDD5FF', borderRadius: 6, background: '#F9F8FF',
  cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#3D2B8A',
  fontFamily: 'var(--font-nunito)', lineHeight: 1.4,
}

type Cmd = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList' | 'formatBlock' | 'indent'

function cmd(command: Cmd, value?: string) {
  document.execCommand(command, false, value)
}

export default function SimpleEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Set initial HTML once on mount
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value ?? ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleInput() {
    if (ref.current) onChange(ref.current.innerHTML)
  }

  return (
    <div style={{ border: '1px solid #DDD5FF', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '6px 8px', borderBottom: '1px solid #DDD5FF', background: '#F9F8FF' }}>
        <button type="button" style={BTN} onMouseDown={e => { e.preventDefault(); cmd('bold') }} title="Жирный"><strong>Б</strong></button>
        <button type="button" style={BTN} onMouseDown={e => { e.preventDefault(); cmd('italic') }} title="Курсив"><em>К</em></button>
        <div style={{ width: 1, background: '#DDD5FF', margin: '2px 2px' }} />
        <button type="button" style={BTN} onMouseDown={e => { e.preventDefault(); cmd('formatBlock', 'h2') }} title="Заголовок H2">H2</button>
        <button type="button" style={BTN} onMouseDown={e => { e.preventDefault(); cmd('formatBlock', 'h3') }} title="Заголовок H3">H3</button>
        <button type="button" style={BTN} onMouseDown={e => { e.preventDefault(); cmd('formatBlock', 'p') }} title="Обычный текст">¶</button>
        <div style={{ width: 1, background: '#DDD5FF', margin: '2px 2px' }} />
        <button type="button" style={BTN} onMouseDown={e => { e.preventDefault(); cmd('insertUnorderedList') }} title="Список •">• —</button>
        <button type="button" style={BTN} onMouseDown={e => { e.preventDefault(); cmd('insertOrderedList') }} title="Нумерованный список">1.</button>
        <div style={{ width: 1, background: '#DDD5FF', margin: '2px 2px' }} />
        <button type="button" style={BTN} onMouseDown={e => { e.preventDefault(); cmd('formatBlock', 'blockquote') }} title="Цитата">❝</button>
      </div>

      {/* Editor area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          minHeight: 200, padding: '12px 14px', outline: 'none',
          fontSize: 14, lineHeight: 1.7, color: '#2D1F6E',
          fontFamily: 'var(--font-nunito)',
        }}
      />

      {/* Inline styles so the editor itself looks like the output */}
      <style>{`
        [contenteditable] h2 { font-size: 18px; font-weight: 800; margin: 18px 0 8px; color: #2D1F6E; }
        [contenteditable] h3 { font-size: 15px; font-weight: 700; margin: 14px 0 6px; color: #2D1F6E; }
        [contenteditable] p  { margin-bottom: 10px; }
        [contenteditable] blockquote { border-left: 3px solid #7C5CFC; padding-left: 14px; color: #7B6FAA; font-style: italic; margin: 12px 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 20px; margin-bottom: 10px; }
        [contenteditable] li { margin-bottom: 4px; }
      `}</style>
    </div>
  )
}
