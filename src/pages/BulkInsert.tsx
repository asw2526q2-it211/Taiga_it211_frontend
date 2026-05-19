import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bulkCreateIssues, parseBulkSubjects } from '../services/issues'
import { ApiError } from '../services/client'

const REQUIRED_MSG = 'This value is required.'

/**
 * Inserció massiva d'incidències (equivalent a bulk_insert_form.html).
 * Una línia del textarea = un subject nou.
 */
export const BulkInsert: React.FC = () => {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    navigate('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const subjects = parseBulkSubjects(text)

    if (subjects.length === 0) {
      setError(REQUIRED_MSG)
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await bulkCreateIssues(subjects)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(REQUIRED_MSG)
      } else {
        setError(err instanceof Error ? err.message : 'Could not save issues.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{bulkInsertStyles}</style>
      <div className="bulk-lightbox" role="dialog" aria-modal="true" aria-labelledby="bulk-insert-title">
      <div className="bulk-content">
        <button
          type="button"
          className="bulk-close"
          onClick={handleClose}
          title="Close"
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h1 id="bulk-insert-title" className="bulk-title">
          New bulk insert
        </h1>

        <form className="bulk-form" onSubmit={handleSubmit} noValidate>
          <textarea
            name="bulk_subjects"
            className={`bulk-textarea${error ? ' is-invalid' : ''}`}
            placeholder="One item per line..."
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (error) setError(null)
            }}
            disabled={submitting}
            autoFocus
          />

          {error && <div className="bulk-error-msg">{error}</div>}

          <div className="bulk-footer">
            <button type="submit" className="bulk-save-btn" disabled={submitting}>
              {submitting ? 'Saving…' : 'SAVE'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

const bulkInsertStyles = `
.bulk-lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow-y: auto;
  background: var(--bulk-overlay-bg);
}

.bulk-content {
  position: relative;
  width: 100%;
  max-width: 520px;
  padding: 40px 20px;
}

.bulk-close {
  position: absolute;
  top: 40px;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color 0.15s ease, background-color 0.15s ease;
}

.bulk-close:hover {
  color: var(--color-teal);
  background: var(--bg-primary);
}

.bulk-title {
  margin: 20px 0 30px;
  font-size: 26px;
  font-weight: 500;
  text-align: center;
  color: var(--text-primary);
}

.bulk-form {
  display: flex;
  flex-direction: column;
}

.bulk-textarea {
  box-sizing: border-box;
  width: 100%;
  height: 260px;
  padding: 12px 15px;
  border: 1.5px solid var(--color-teal);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-surface);
  resize: vertical;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.bulk-textarea:focus {
  box-shadow: 0 0 0 2px rgba(0, 154, 166, 0.12);
}

.bulk-textarea.is-invalid {
  border-color: var(--color-bug);
}

.bulk-error-msg {
  margin-top: 5px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-bug);
}

.bulk-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.bulk-save-btn {
  padding: 10px 28px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-on-mint);
  background: var(--color-mint);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.bulk-save-btn:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.bulk-save-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}
`