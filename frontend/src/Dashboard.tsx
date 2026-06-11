import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { useAuth } from './auth'
import * as api from './api'
import { formatError } from './api'

const STATUS_COLORS: Record<string, string> = {
  Applied: '#999',
  Interviewing: '#3b82f6',
  Offered: '#10b981',
  Accepted: '#8b5cf6',
  Rejected: '#ef4444'
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || '#999'
}

interface DroppableColumnProps {
  id: api.Application['status']
  isOver: boolean
  children: ReactNode
}

function DroppableColumn({ id, isOver, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className="board-column"
      style={{
        backgroundColor: isOver ? 'rgba(59, 130, 246, 0.08)' : undefined,
        border: isOver ? '2px dashed #2563eb' : undefined
      }}
    >
      {children}
    </div>
  )
}

type DraggableCardProps = {
  app: api.Application
  onEdit: (application: api.Application) => void
  onDelete: (application: api.Application) => void
}

function DraggableCard({ app, onEdit, onDelete }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id })

  return (
    <div
      ref={setNodeRef}
      className="application-card"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1
      }}
      {...attributes}
      {...listeners}
    >
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
      <p className="date">Applied: {new Date(app.appliedDate).toLocaleDateString()}</p>
      {app.notes && <p className="notes">{app.notes}</p>}
      <div className="action-row">
        <button
          type="button"
          className="secondary-button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(app)}
        >
          Edit
        </button>
        <button
          type="button"
          className="delete-button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(app)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export function Dashboard() {
  const auth = useAuth()
  const [applications, setApplications] = useState<api.Application[]>([])
  const [filteredStatus, setFilteredStatus] = useState<'All' | api.Application['status']>('All')
  const [companyFilter, setCompanyFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null)
  const [hoverStatus, setHoverStatus] = useState<api.Application['status'] | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<api.Application | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    companyName: string
    status: api.Application['status']
    appliedDate: string
    notes: string
  }>( {
    title: '',
    companyName: '',
    status: 'Applied',
    appliedDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const isEditing = editingApplicationId !== null
  const normalizedCompanyFilter = companyFilter.trim().toLowerCase()
  const filteredApplications = applications.filter((application) => {
    const matchesStatus = filteredStatus === 'All' || application.status === filteredStatus
    const matchesCompany = normalizedCompanyFilter === '' ||
      application.companyName.toLowerCase().includes(normalizedCompanyFilter)
    return matchesStatus && matchesCompany
  })

  const statuses: api.Application['status'][] = [
    'Applied',
    'Interviewing',
    'Offered',
    'Accepted',
    'Rejected'
  ]

  const loadApplications = async () => {
    if (!auth.token) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await api.listApplications(auth.token)
      setApplications(data)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [auth.token])

  const resetForm = () => {
    setEditingApplicationId(null)
    setFormData({
      title: '',
      companyName: '',
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setShowForm(false)
  }

  const handleEdit = (application: api.Application) => {
    setEditingApplicationId(application.id)
    setFormData({
      title: application.title,
      companyName: application.companyName,
      status: application.status,
      appliedDate: new Date(application.appliedDate).toISOString().split('T')[0],
      notes: application.notes ?? ''
    })
    setShowForm(true)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setHoverStatus((event.over?.id as api.Application['status'] | undefined) ?? null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setHoverStatus(null)

    if (!auth.token || !over) return

    const application = applications.find((app) => app.id === active.id)
    const newStatus = over.id as api.Application['status']
    if (!application || application.status === newStatus) return

    setError(null)
    try {
      await api.updateApplication(application.id, { status: newStatus }, auth.token)
      await loadApplications()
    } catch (err) {
      setError(formatError(err))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!auth.token) return

    setError(null)

    try {
      if (isEditing && editingApplicationId) {
        await api.updateApplication(
          editingApplicationId,
          {
            title: formData.title,
            companyName: formData.companyName,
            status: formData.status,
            appliedDate: new Date(formData.appliedDate).toISOString(),
            notes: formData.notes
          },
          auth.token
        )
      } else {
        await api.createApplication(
          {
            ...formData,
            appliedDate: new Date(formData.appliedDate).toISOString()
          } as api.CreateApplicationRequest,
          auth.token
        )
      }

      resetForm()
      await loadApplications()
    } catch (err) {
      setError(formatError(err))
    }
  }

  const handleDelete = (application: api.Application) => {
    setDeleteCandidate(application)
  }

  const cancelDelete = () => {
    setDeleteCandidate(null)
  }

  const confirmDelete = async () => {
    if (!auth.token || !deleteCandidate) return

    setError(null)

    try {
      await api.deleteApplication(deleteCandidate.id, auth.token)
      await loadApplications()
    } catch (err) {
      setError(formatError(err))
    } finally {
      setDeleteCandidate(null)
    }
  }

  const boardSections = statuses.map((status) => ({
    status,
    applications: filteredApplications.filter((application) => application.status === status)
  }))

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
          <div className="filter-group">
            <label>
              Filter status
              <select
                value={filteredStatus}
                onChange={(e) => setFilteredStatus(e.target.value as 'All' | api.Application['status'])}
              >
                <option value="All">All statuses</option>
                <option value="Applied">Applied</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Offered">Offered</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </label>
            <label>
              Filter company
              <input
                type="text"
                placeholder="Search by company"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              />
            </label>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              if (isEditing) {
                resetForm()
                return
              }
              setShowForm(!showForm)
            }}
          >
            {showForm ? (isEditing ? 'Cancel edit' : 'Cancel') : 'New Application'}
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
              {isEditing ? 'Update Application' : 'Create Application'}
            </button>
            {isEditing && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </form>
        )}

        <div className="applications-list">
          {isLoading ? (
            <p>Loading applications...</p>
          ) : filteredApplications.length === 0 ? (
            <p className="empty-state">No applications match this filter.</p>
          ) : (
            <DndContext onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <div className="board">
                {boardSections.map((section) => (
                  <DroppableColumn key={section.status} id={section.status} isOver={section.status === hoverStatus}>
                    <div className="board-column-header">
                      <h2>{section.status}</h2>
                      <span className="board-column-count">{section.applications.length}</span>
                    </div>
                    <div className="board-column-list">
                      {section.applications.length === 0 ? (
                        <div className="empty-column">No applications</div>
                      ) : (
                        section.applications.map((app) => (
                          <DraggableCard
                            key={app.id}
                            app={app}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))
                      )}
                    </div>
                  </DroppableColumn>
                ))}
              </div>
            </DndContext>
          )}
        </div>
      </div>

      {deleteCandidate && (
        <div className="modal-overlay" role="presentation" onClick={cancelDelete}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-confirm-title">Delete application?</h2>
            <p>
              Are you sure you want to delete <strong>{deleteCandidate.title}</strong> at{' '}
              <strong>{deleteCandidate.companyName}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={cancelDelete}>
                Cancel
              </button>
              <button type="button" className="delete-button" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
