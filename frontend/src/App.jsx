import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const api = axios.create({ baseURL: apiBaseUrl })

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

function formatDate(value) {
  const date = dateFromApi(value)
  return date
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : 'Not recorded'
}

const statusColors = {
  scheduled: '#b99a5d',
  active: '#4d8059',
  paused: '#7890a1',
  completed: '#335e41',
  interrupted: '#b77355',
  abandoned: '#a35f52',
  overdue: '#8d5148',
}

function Dashboard() {
  const [history, setHistory] = useState(null)
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState(50)
  const [reasons, setReasons] = useState({})
  const [error, setError] = useState('')
  const [clock, setClock] = useState(0)
  const [notifications, setNotifications] = useState([])
  const nextNotificationId = useRef(0)
  const notifiedThresholds = useRef(new Set())

  const addNotification = useCallback((notification) => {
    const id = nextNotificationId.current + 1
    nextNotificationId.current = id
    setNotifications((current) => [{ ...notification, id }, ...current].slice(0, 4))
  }, [])

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
      const response = await api.patch(`/sessions/${sessionId}/${action}`, payload)
      setNotifications((current) => current.filter((notification) => notification.sessionId !== sessionId))
      const messages = {
        start: ['Session started', 'Your focus timer is running.', 'success'],
        pause: ['Session paused', 'Your interruption has been recorded.', 'info'],
        resume: ['Session resumed', 'Your focus timer is running again.', 'success'],
      }
      if (action === 'complete') {
        addNotification({
          title: response.data.status === 'overdue' ? 'Session marked overdue' : 'Session completed',
          message: `“${response.data.title}” has been saved to your history.`,
          tone: response.data.status === 'overdue' ? 'warning' : 'success',
          sessionId,
        })
      } else {
        const [notificationTitle, message, tone] = messages[action]
        addNotification({
          title: notificationTitle,
          message: `“${response.data.title}” — ${message}`,
          tone,
          sessionId,
        })
      }
      await refreshHistory()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Could not update the session.')
    }
  }

  const sessions = useMemo(() => history?.sessions || [], [history])

  useEffect(() => {
    if (!clock) return

    sessions
      .filter((session) => session.status === 'active')
      .forEach((session) => {
        const remaining = getRemainingSeconds(session, clock)
        if (remaining === null) return

        const warningKey = `${session.id}:five-minutes`
        if (remaining > 0 && remaining <= 300 && !notifiedThresholds.current.has(warningKey)) {
          notifiedThresholds.current.add(warningKey)
          addNotification({
            title: '5 minutes left',
            message: `“${session.title}” is nearing its time limit.`,
            tone: 'warning',
            sessionId: session.id,
          })
        }

        const limitKey = `${session.id}:time-limit`
        if (remaining === 0 && !notifiedThresholds.current.has(limitKey)) {
          notifiedThresholds.current.add(limitKey)
          addNotification({
            title: 'Time limit reached',
            message: `“${session.title}” has reached its planned focus time.`,
            tone: 'warning',
            sessionId: session.id,
            action: { label: 'Complete session', sessionId: session.id, action: 'complete' },
          })
        }
      })
  }, [addNotification, clock, sessions])

  const recentSessions = [...sessions].reverse().slice(-7)
  const statusCounts = sessions.reduce((counts, session) => {
    counts[session.status] = (counts[session.status] || 0) + 1
    return counts
  }, {})
  const visibleStatuses = Object.keys(statusColors).filter((status) => statusCounts[status])
  const maximumFocus = Math.max(15, Math.ceil(Math.max(...recentSessions.map((session) => session.focus_minutes), 0) / 15) * 15)
  const chartTicks = Array.from({ length: 5 }, (_, index) => maximumFocus - index * maximumFocus / 4)

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">dw</span>
          <span>deepwork</span>
        </Link>
        <a className="api-link" href={`${apiBaseUrl}/docs`} target="_blank" rel="noreferrer">
          API docs <span aria-hidden="true">↗</span>
        </a>
      </header>

      {notifications.length > 0 && (
        <section className="notification-stack" aria-label="Session notifications" aria-live="polite">
          {notifications.map((notification) => (
            <article
              className={`notification notification-${notification.tone}`}
              key={notification.id}
              role={notification.tone === 'warning' ? 'alert' : 'status'}
            >
              <span className="notification-icon" aria-hidden="true">
                {notification.tone === 'warning' ? '!' : notification.tone === 'success' ? '✓' : '⏸'}
              </span>
              <div className="notification-copy">
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
                {notification.action && (
                  <button
                    className="notification-action"
                    onClick={() => {
                      setNotifications((current) => current.filter((item) => item.id !== notification.id))
                      updateSession(notification.action.sessionId, notification.action.action)
                    }}
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
              <button
                className="notification-dismiss"
                aria-label={`Dismiss ${notification.title} notification`}
                onClick={() => setNotifications((current) => current.filter((item) => item.id !== notification.id))}
              >
                ×
              </button>
            </article>
          ))}
        </section>
      )}

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

      <section className="charts-grid" aria-label="Productivity charts">
        <article className="chart-panel focus-chart-panel">
          <div className="chart-heading">
            <div>
              <p className="eyebrow">TIME WELL SPENT</p>
              <h2>Focus minutes</h2>
            </div>
            <span className="chart-period">Last {recentSessions.length} sessions</span>
          </div>
          {recentSessions.length > 0 ? (
            <div className="focus-chart-scroll">
              <svg className="focus-chart" viewBox="0 0 640 230" role="img" aria-label="Focus minutes for your recent sessions">
                {chartTicks.map((tick) => {
                  const y = 180 - (tick / maximumFocus) * 145
                  return (
                    <g key={tick}>
                      <line x1="42" y1={y} x2="630" y2={y} className="chart-gridline" />
                      <text x="34" y={y + 4} className="chart-axis-label" textAnchor="end">{Math.round(tick)}</text>
                    </g>
                  )
                })}
                {recentSessions.map((session, index) => {
                  const slot = 588 / recentSessions.length
                  const barWidth = Math.min(38, slot * 0.54)
                  const barHeight = session.focus_minutes ? Math.max(4, session.focus_minutes / maximumFocus * 145) : 3
                  const x = 42 + slot * index + (slot - barWidth) / 2
                  const date = dateFromApi(session.start_time || session.created_at)
                  const label = session.title.length > 10 ? `${session.title.slice(0, 9)}…` : session.title
                  return (
                    <g key={session.id}>
                      <title>{`${session.title}: ${session.focus_minutes} focus minutes`}</title>
                      <rect
                        x={x}
                        y={180 - barHeight}
                        width={barWidth}
                        height={barHeight}
                        rx="5"
                        className={session.status === 'active' ? 'focus-bar focus-bar-active' : 'focus-bar'}
                      />
                      <text x={x + barWidth / 2} y="199" className="chart-session-label" textAnchor="middle">
                        {label}
                      </text>
                      <text x={x + barWidth / 2} y="216" className="chart-date-label" textAnchor="middle">
                        {date?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || ''}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          ) : (
            <div className="chart-empty">Focus time will appear here as you complete sessions.</div>
          )}
          <div className="chart-footnote">Actual focused time, excluding pauses</div>
        </article>

        <article className="chart-panel status-chart-panel">
          <div className="chart-heading">
            <div>
              <p className="eyebrow">A CLEARER PICTURE</p>
              <h2>Session outcomes</h2>
            </div>
          </div>
          {sessions.length > 0 ? (
            <>
              <div
                className="status-bar"
                role="img"
                aria-label={visibleStatuses.map((status) => `${statusCounts[status]} ${status}`).join(', ')}
              >
                {visibleStatuses.map((status) => (
                  <span
                    key={status}
                    className="status-segment"
                    style={{
                      width: `${statusCounts[status] / sessions.length * 100}%`,
                      backgroundColor: statusColors[status],
                    }}
                    title={`${status}: ${statusCounts[status]}`}
                  />
                ))}
              </div>
              <ul className="status-legend">
                {visibleStatuses.map((status) => (
                  <li key={status}>
                    <span className="legend-swatch" style={{ backgroundColor: statusColors[status] }} />
                    <span className="legend-label">{status}</span>
                    <strong>{statusCounts[status]}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="chart-empty">Your session status breakdown will show here.</div>
          )}
          <div className="chart-footnote">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} in your history
          </div>
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
                      <h3>
                        <Link className="session-detail-link" to={`/sessions/${session.id}`}>
                          {session.title}
                        </Link>
                      </h3>
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

function SessionDetail() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        const response = await api.get(`/sessions/${sessionId}`)
        if (active) setSession(response.data)
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.detail || 'Could not load this session.')
        }
      }
    }

    loadSession()
    return () => {
      active = false
    }
  }, [sessionId])

  return (
    <main className="page-shell detail-page">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">dw</span>
          <span>deepwork</span>
        </Link>
        <Link className="api-link" to="/">← Back to sessions</Link>
      </header>

      {error ? (
        <section className="detail-error" role="alert">
          <p className="eyebrow">SESSION UNAVAILABLE</p>
          <h1>We couldn’t find that session.</h1>
          <p>{error}</p>
          <Link className="primary-button detail-back-button" to="/">Return to your sessions</Link>
        </section>
      ) : !session ? (
        <p className="detail-loading" role="status">Loading session details…</p>
      ) : (
        <>
          <section className="detail-intro">
            <p className="eyebrow">SESSION DETAILS</p>
            <div className="detail-title-row">
              <h1>{session.title}</h1>
              <span className={`status status-${session.status}`}>{session.status}</span>
            </div>
            <p className="detail-goal">{session.goal || 'No goal was set for this session.'}</p>
          </section>

          <section className="detail-stats" aria-label="Session statistics">
            <article className="detail-stat">
              <span>Planned duration</span>
              <strong>{session.scheduled_duration} min</strong>
            </article>
            <article className="detail-stat">
              <span>Focused time</span>
              <strong>{session.focus_minutes} min</strong>
            </article>
            <article className="detail-stat">
              <span>Elapsed time</span>
              <strong>{session.elapsed_minutes} min</strong>
            </article>
            <article className="detail-stat">
              <span>Interruptions</span>
              <strong>{session.pause_count}</strong>
            </article>
          </section>

          <section className="detail-content-grid">
            <article className="detail-panel">
              <p className="eyebrow">SESSION RECORD</p>
              <h2>Timing</h2>
              <dl className="detail-fields">
                <div><dt>Session ID</dt><dd>{session.id}</dd></div>
                <div><dt>Status</dt><dd className="capitalize">{session.status}</dd></div>
                <div><dt>Created</dt><dd>{formatDate(session.created_at)}</dd></div>
                <div><dt>Started</dt><dd>{formatDate(session.start_time)}</dd></div>
                <div><dt>Completed or ended</dt><dd>{formatDate(session.end_time)}</dd></div>
              </dl>
            </article>

            <article className="detail-panel">
              <p className="eyebrow">FOCUS REFLECTION</p>
              <h2>Time breakdown</h2>
              <div className="time-breakdown">
                <div className="time-breakdown-labels">
                  <span>Focused</span>
                  <strong>{session.focus_minutes} min</strong>
                </div>
                <div className="time-breakdown-track" aria-label={`${session.focus_minutes} focus minutes out of ${session.elapsed_minutes} elapsed minutes`}>
                  <span
                    style={{
                      width: `${session.elapsed_minutes ? Math.min(100, session.focus_minutes / session.elapsed_minutes * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="time-breakdown-labels secondary-time">
                  <span>Paused</span>
                  <strong>{Math.max(0, session.elapsed_minutes - session.focus_minutes)} min</strong>
                </div>
                <p className="detail-note">Focused time excludes the intervals recorded in your interruption log.</p>
              </div>
            </article>
          </section>

          <section className="detail-panel interruption-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">WHAT PULLED YOU AWAY</p>
                <h2>Interruption timeline</h2>
              </div>
              <span className="session-count">{session.pause_count} {session.pause_count === 1 ? 'pause' : 'pauses'}</span>
            </div>
            {session.interruptions.length ? (
              <ol className="interruption-timeline">
                {session.interruptions.map((interruption, index) => (
                  <li key={interruption.id}>
                    <span className="timeline-marker">{index + 1}</span>
                    <div className="timeline-content">
                      <strong>{interruption.reason}</strong>
                      <span>Paused {formatDate(interruption.pause_time)}</span>
                      <span>
                        {interruption.resume_time
                          ? `Resumed ${formatDate(interruption.resume_time)}`
                          : session.status === 'abandoned'
                            ? 'Not resumed'
                            : 'Still paused'}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="no-interruptions">No interruptions were recorded for this session.</p>
            )}
          </section>
        </>
      )}
      <footer>One session at a time. The rest can wait.</footer>
    </main>
  )
}

function NotFound() {
  return (
    <main className="page-shell detail-error">
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>That page isn’t here.</h1>
      <Link className="primary-button detail-back-button" to="/">Return to your sessions</Link>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/sessions/:sessionId" element={<SessionDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
