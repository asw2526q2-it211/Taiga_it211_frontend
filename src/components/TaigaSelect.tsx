import React, { useState } from 'react'
import type { ColorResource } from '../types/api'

interface TaigaSelectProps {
  label: string
  options: ColorResource[]
  value: string
  onChange: (name: string) => void
}

/** Desplegable d'atribut amb punt de color (tipus, gravetat, prioritat). */
export const TaigaSelect: React.FC<TaigaSelectProps> = ({
  label,
  options,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.name === value) ?? options[0]

  return (
    <div className="new-issue-attribute-row">
      <span>{label}</span>
      <div
        className={`taiga-select${open ? ' open' : ''}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type="button"
          className="taiga-select-trigger"
          onClick={() => setOpen((v) => !v)}
        >
          <span>{selected?.name ?? '—'}</span>
          {selected && (
            <div
              className="color-dot"
              style={{ backgroundColor: selected.color }}
            />
          )}
        </button>
        <div className="taiga-select-menu">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="taiga-option"
              onClick={() => {
                onChange(opt.name)
                setOpen(false)
              }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
