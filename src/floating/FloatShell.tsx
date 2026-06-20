// src/floating/FloatShell.tsx
import { useState, useRef, useEffect, type ReactNode, type MouseEvent as RMouseEvent } from 'react'
import { twMerge } from 'tailwind-merge'

const DRAG_THRESHOLD = 4

interface Props {
  isExpanded: boolean
  onToggle: () => void
  foldedBar: ReactNode
  children: ReactNode
  className?: string
}

interface DragState {
  startX: number
  startY: number
  isDragging: boolean
  dragStarted: boolean
  offsetX: number
  offsetY: number
}

export function FloatShell({ isExpanded, onToggle, foldedBar, children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState>({
    startX: 0,
    startY: 0,
    isDragging: false,
    dragStarted: false,
    offsetX: 0,
    offsetY: 0,
  })
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: RMouseEvent<HTMLDivElement>) => {
    // 展开态下,内部控件不响应
    if (isExpanded) return
    // 折叠态下,带 data-no-expand 的子元素不响应(btn 短路)
    if ((e.target as HTMLElement).closest('[data-no-expand]')) return

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      isDragging: true,
      dragStarted: false,
      offsetX: pos.x,
      offsetY: pos.y,
    }
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      dragRef.current.dragStarted = true
      // 限制在视口内(简化:不超 100vw / 100vh)
      const maxX = window.innerWidth - 240
      const maxY = window.innerHeight - 36
      setPos({
        x: Math.max(0, Math.min(maxX, dragRef.current.offsetX + dx)),
        y: Math.max(0, Math.min(maxY, dragRef.current.offsetY + dy)),
      })
    }
    const handleUp = () => {
      if (!dragRef.current.isDragging) return
      if (!dragRef.current.dragStarted) {
        // 短按 = toggle
        onToggle()
      }
      dragRef.current.isDragging = false
      dragRef.current.dragStarted = false
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [onToggle, pos.x, pos.y])

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        // CSS transform 走 GPU,无重渲染
        transform: 'translateZ(0)',
      }}
      className={twMerge('select-none cursor-grab active:cursor-grabbing', className)}
    >
      {/* 折叠态 bar */}
      {isExpanded ? null : foldedBar}

      {/* 展开态内容:D-11 grid-template-rows 0fr→1fr 过渡 */}
      {isExpanded && (
        <div
          data-float-expand
          className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden min-h-0">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
