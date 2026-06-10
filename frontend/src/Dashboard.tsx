import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from './auth'
import * as api from './api'

export function Dashboard() {
  const auth = useAuth()
  const [applications, setApplications] = useState<api.Application[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<{
    title: string
    companyName: string
    status: api.Application['status']
    appliedDate: string
    notes: string
  }>({
    title: '',
    companyName: '',
    status: 'Applied',
    appliedDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const loadApplications = async () => {
    if (!auth.token) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await api.listApplications(auth.token)
      setApplications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [auth.token])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!auth.token) return

    setError(null)

    try {
      await api.createApplication(
        {
          ...formData,
          appliedDate: new Date(formData.appliedDate).toISOString()
        } as api.CreateApplicationRequest,
        auth.token
      )
      setFormData({
        title: '',
        companyName: '',
        status: 'Applied',
        appliedDate: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setShowForm(false)
      await loadApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create application')
    }
  }

  const handleDelete = async (id: string) => {
    if (!auth.token || !window.confirm('Are you sure?')) return

    setError(null)

    try {
      await api.deleteApplication(id, auth.token)
      await loadApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Applied: '#999',
      Interviewing: '#3b82f6',
      Offered: '#10b981',
      Accepted: '#8b5cf6',
      Rejected: '#ef4444'
    }
    return colors[status] || '#999'
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Application Tracker</h1>
          <p>Hello, <strong>{auth.user?.email}</strong></p>
        </div>
        <button className="logout-button" onClick={auth.logout}>
          Sign out
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-content">
        <div className="controls">
          <button
            className="primary-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'New Application'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="application-form">
            <label>
              Position Title
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </label>
            <label>
              Company
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                required
              />
            </label>
            <label>
              Status
              <select
                value={formData.status}
                onChange={(e) => {
                  const status = e.target.value as api.Application['status']
                  setFormData({ ...formData, status })
                }}
              >
                <option>Applied</option>
                <option>Interviewing</option>
                <option>Offered</option>
                <option>Accepted</option>
                <option>Rejected</option>
              </select>
            </label>
            <label>
              Applied Date
              <input
                type="date"
                value={formData.appliedDate}
                onChange={(e) =>
                  setFormData({ ...formData, appliedDate: e.target.value })
                }
                required
              />
            </label>
            <label>
              Notes
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </label>
            <button type="submit" className="primary-button">
              Create Application
            </button>
          </form>
        )}

        <div className="applications-list">
          {isLoading ? (
            <p>Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="empty-state">No applications yet. Create one to get started!</p>
          ) : (
            <div className="grid">
              {applications.map((app) => (
                <div key={app.id} className="application-card">
                  <div className="card-header">
                    <h3>{app.title}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(app.status) }}
                    >
                      {app.status}
                    </span>
                  </div>
                  <p className="company">{app.companyName}</p>
                  <p className="date">
                    Applied: {new Date(app.appliedDate).toLocaleDateString()}
                  </p>
                  {app.notes && <p className="notes">{app.notes}</p>}
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(app.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
