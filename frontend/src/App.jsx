import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const api = axios.create({ baseURL: 'http://127.0.0.1:8000' })

function dateFromApi(value) {
  if (!value) return null
  return new Date(value.endsWith('Z') ? value : `${value}Z`)
}

function getRemainingSeconds(session, clock) {
  if (session.status !== 'active' || !session.start_time) return null
  const startedAt = dateFromApi(session.start_time)
  const pausedSeconds = session.interruptions.reduce((total, interruption) => {
    const pausedAt = dateFromApi(interruption.pause_time)
    const resumedAt = dateFromApi(interruption.resume_time) || clock
    return total + Math.max(0, (resumedAt - pausedAt) / 1000)
  }, 0)
  const focusSeconds = Math.max(0, (clock - startedAt) / 1000 - pausedSeconds)
  return Math.max(0, session.scheduled_duration * 60 - focusSeconds)
}

function formatTime(seconds) {
  const rounded = Math.ceil(seconds)
  const minutes = Math.floor(rounded / 60)
  const remainder = rounded % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function App() {
  const [history, setHistory] = useState(null)
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState(50)
  const [reasons, setReasons] = useState({})
  const [error, setError] = useState('')
  const [clock, setClock] = useState(0)

  const refreshHistory = useCallback(async () => {
    try {
      const response = await api.get('/sessions/history')
      setHistory(response.data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not connect to the API.')
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(refreshHistory, 0)
    const refreshTimer = window.setInterval(refreshHistory, 5000)
    const clockTimer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(refreshTimer)
      window.clearInterval(clockTimer)
    }
  }, [refreshHistory])

  async function scheduleSession(event) {
    event.preventDefault()
    try {
      await api.post('/sessions/', {
        title,
        goal: goal || null,
        duration: Number(duration),
      })
      setTitle('')
      setGoal('')
      setDuration(50)
      await refreshHistory()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not schedule the session.')
    }
  }

  async function updateSession(sessionId, action, payload) {
    try {
      await api.patch(`/sessions/${sessionId}/${action}`, payload)
      await refreshHistory()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not update the session.')
    }
  }

  const sessions = history?.sessions || []

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">dw</span>
          <span>deepwork</span>
        </a>
        <a className="api-link" href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
          API docs <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="intro">
        <p className="eyebrow">MAKE SPACE FOR WHAT MATTERS</p>
        <h1>Find your focus.</h1>
        <p className="subtitle">Plan a session, protect your attention, and see the progress add up.</p>
      </section>

      <section className="stats-grid" aria-label="Productivity summary">
        <article className="stat-card">
          <span className="stat-label">Sessions</span>
          <strong>{history?.total_sessions ?? '—'}</strong>
          <span className="stat-note">planned in total</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Focus time</span>
          <strong>{history?.total_focus_minutes ?? '—'}<small> min</small></strong>
          <span className="stat-note">time spent working</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Completion</span>
          <strong>{history ? `${Math.round(history.completion_ratio * 100)}%` : '—'}</strong>
          <span className="stat-note">{history?.completed_sessions ?? 0} completed sessions</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Interruptions</span>
          <strong>{history?.total_pauses ?? '—'}</strong>
          <span className="stat-note">pauses recorded</span>
        </article>
      </section>

      <div className="content-grid">
        <section className="schedule-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">START WITH A PLAN</p>
              <h2>Schedule a session</h2>
            </div>
            <span className="heading-icon" aria-hidden="true">＋</span>
          </div>
          <form className="schedule-form" onSubmit={scheduleSession}>
            <label>
              Session title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Draft the proposal"
                maxLength="200"
                required
              />
            </label>
            <label>
              Goal <span className="optional-label">Optional</span>
              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="What would make this session a success?"
                maxLength="2000"
                rows="3"
              />
            </label>
            <label>
              Duration
              <span className="duration-input">
                <input
                  type="number"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  min="1"
                  max="1440"
                  required
                />
                <span>minutes</span>
              </span>
            </label>
            <button className="primary-button" type="submit">Add to your plan <span aria-hidden="true">→</span></button>
          </form>
        </section>

        <section className="history-panel">
          <div className="section-heading history-heading">
            <div>
              <p className="eyebrow">YOUR WORK, IN RHYTHM</p>
              <h2>Session history</h2>
            </div>
            <span className="session-count">{sessions.length} total</span>
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          {!history && !error && <p className="empty-state">Connecting to your sessions…</p>}
          {history && sessions.length === 0 && (
            <div className="empty-state">
              <span aria-hidden="true">✳</span>
              <p>Your next focused hour starts here.</p>
              <small>Schedule a session to get going.</small>
            </div>
          )}

          <div className="session-list">
            {sessions.map((session) => {
              const remaining = getRemainingSeconds(session, clock)
              return (
                <article className="session-card" key={session.id}>
                  <div className="session-main">
                    <div className="session-title-row">
                      <h3>{session.title}</h3>
                      <span className={`status status-${session.status}`}>{session.status}</span>
                    </div>
                    {session.goal && <p className="session-goal">{session.goal}</p>}
                    <div className="session-meta">
                      <span>{session.scheduled_duration} min planned</span>
                      <span>{session.focus_minutes} min focus</span>
                      <span>{session.pause_count} {session.pause_count === 1 ? 'pause' : 'pauses'}</span>
                      {remaining !== null && <strong className="countdown">{formatTime(remaining)} left</strong>}
                    </div>
                    {session.interruptions.length > 0 && (
                      <details className="interruption-details">
                        <summary>Interruption notes</summary>
                        <ul>
                          {session.interruptions.map((interruption) => (
                            <li key={interruption.id}>{interruption.reason}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                  <div className="session-actions">
                    {session.status === 'scheduled' && (
                      <button className="small-button" onClick={() => updateSession(session.id, 'start')}>Start</button>
                    )}
                    {session.status === 'active' && (
                      <>
                        <form
                          className="pause-form"
                          onSubmit={(event) => {
                            event.preventDefault()
                            const reason = reasons[session.id]?.trim()
                            if (reason) {
                              updateSession(session.id, 'pause', { reason })
                              setReasons((current) => ({ ...current, [session.id]: '' }))
                            }
                          }}
                        >
                          <input
                            aria-label={`Interruption reason for ${session.title}`}
                            placeholder="Why pause?"
                            value={reasons[session.id] || ''}
                            onChange={(event) => setReasons((current) => ({ ...current, [session.id]: event.target.value }))}
                            maxLength="1000"
                            required
                          />
                          <button className="small-button secondary-button" type="submit">Pause</button>
                        </form>
                        <button className="small-button complete-button" onClick={() => updateSession(session.id, 'complete')}>Complete</button>
                      </>
                    )}
                    {session.status === 'paused' && (
                      <button className="small-button" onClick={() => updateSession(session.id, 'resume')}>Resume</button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
      <footer>One session at a time. The rest can wait.</footer>
    </main>
  )
}

export default App
