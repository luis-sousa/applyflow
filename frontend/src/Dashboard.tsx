import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { useAuth } from './auth'
import * as api from './api'
import { formatError } from './api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type StatusBadge = {
  variant: 'default' | 'secondary' | 'destructive'
  className?: string
}

const STATUS_BADGES: Record<string, StatusBadge> = {
  Applied: { variant: 'secondary' },
  Interviewing: { variant: 'default' },
  Offered: { variant: 'default', className: 'bg-amber-500 text-white' },
  Accepted: { variant: 'default', className: 'bg-emerald-500 text-white' },
  Rejected: { variant: 'destructive' },
}

function getStatusBadge(status: string): StatusBadge {
  return STATUS_BADGES[status] ?? { variant: 'secondary' }
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
      className={cn(
        'flex min-h-[320px] flex-col gap-4 rounded-2xl border bg-muted/40 p-4',
        isOver && 'border-primary border-dashed bg-primary/5'
      )}
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
  const badge = getStatusBadge(app.status)

  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="gap-3 py-4 transition-transform hover:-translate-y-0.5"
      {...attributes}
      {...listeners}
    >
      <CardHeader className="flex-row items-start justify-between gap-2 px-4">
        <CardTitle className="text-base">{app.title}</CardTitle>
        <Badge variant={badge.variant} className={badge.className}>
          {app.status}
        </Badge>
      </CardHeader>
      <CardContent className="px-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{app.companyName}</p>
        <p className="mt-1 text-xs">Applied: {new Date(app.appliedDate).toLocaleDateString()}</p>
        {app.notes && (
          <p className="mt-3 rounded-md bg-muted p-2 text-sm">{app.notes}</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 px-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(app)}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="flex-1"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(app)}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
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
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b px-8 py-6">
        <div>
          <h1 className="m-0 text-2xl font-semibold">Application Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Hello, <strong className="text-foreground">{auth.user?.email}</strong>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={auth.logout}>
          Sign out
        </Button>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 p-8">
        {error && (
          <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Filter status
              <select
                className="min-w-[170px] rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            <label className="grid gap-2 text-sm font-medium">
              Filter company
              <input
                type="text"
                placeholder="Search by company"
                className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              />
            </label>
          </div>
          <Button
            onClick={() => {
              if (isEditing) {
                resetForm()
                return
              }
              setShowForm(!showForm)
            }}
          >
            {showForm ? (isEditing ? 'Cancel edit' : 'Cancel') : 'New Application'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 grid gap-4 rounded-2xl border bg-card p-6">
            <label className="grid gap-2 text-sm font-medium">
              Position Title
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Company
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Status
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            <label className="grid gap-2 text-sm font-medium">
              Applied Date
              <input
                type="date"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={formData.appliedDate}
                onChange={(e) =>
                  setFormData({ ...formData, appliedDate: e.target.value })
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Notes
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </label>
            <div className="flex gap-3">
              <Button type="submit">
                {isEditing ? 'Update Application' : 'Create Application'}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        )}

        <div className="w-full">
          {isLoading ? (
            <p className="text-muted-foreground">Loading applications...</p>
          ) : filteredApplications.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No applications match this filter.</p>
          ) : (
            <DndContext onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {boardSections.map((section) => (
                  <DroppableColumn key={section.status} id={section.status} isOver={section.status === hoverStatus}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="m-0 text-sm font-semibold tracking-wide uppercase text-foreground">
                        {section.status}
                      </h2>
                      <span className="inline-flex min-w-[34px] items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                        {section.applications.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {section.applications.length === 0 ? (
                        <div className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">
                          No applications
                        </div>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={cancelDelete}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-card p-6 text-card-foreground shadow-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-confirm-title" className="text-lg font-semibold">
              Delete application?
            </h2>
            <p className="mt-2 mb-6 text-sm text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{deleteCandidate.title}</strong> at{' '}
              <strong className="text-foreground">{deleteCandidate.companyName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
