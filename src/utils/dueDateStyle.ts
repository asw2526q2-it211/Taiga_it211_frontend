import type { DueDateRule } from '../types/api'

function parseDate(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function daysUntil(dueDate: string): number {
  const due = parseDate(dueDate)
  if (!due) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** Colors de fons i icona del botó de data límit (com al template Django). */
export function getDueDateButtonStyle(
  dueDate: string,
  rules: DueDateRule[],
): { background: string; iconColor: string } {
  if (!dueDate) {
    return { background: '#f4f6f8', iconColor: '#009aa6' }
  }

  const sorted = [...rules]
    .filter((r) => r.days_to_due !== null)
    .sort((a, b) => (a.days_to_due ?? 0) - (b.days_to_due ?? 0))

  const daysLeft = daysUntil(dueDate)
  for (const rule of sorted) {
    if (daysLeft <= (rule.days_to_due ?? 0)) {
      return { background: rule.color, iconColor: '#ffffff' }
    }
  }

  const bg = sorted.length > 0 ? sorted[sorted.length - 1].color : '#23e27a'
  return { background: bg, iconColor: '#ffffff' }
}
