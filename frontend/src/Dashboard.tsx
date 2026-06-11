import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import type { DragStartEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { toast } from 'sonner'
import { useAuth } from './auth'
import * as api from './api'
import { formatError } from './api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const STATUSES: api.Application['status'][] = [
  'Applied',
  'Interviewing',
  'Offered',
  'Accepted',
  'Rejected',
]

const EMPTY_FORM = {
  title: '',
  companyName: '',
  status: 'Applied' as api.Application['status'],
  appliedDate: new Date().toISOString().split('T')[0],
  notes: '',
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

type ApplicationCardProps = DraggableCardProps & {
  className?: string
  style?: CSSProperties
  refProp?: (node: HTMLElement | null) => void
}

function ApplicationCard({ app, onEdit, onDelete, className, style, refProp, ...rest }: ApplicationCardProps & Record<string, unknown>) {
  const badge = getStatusBadge(app.status)

  return (
    <Card ref={refProp} style={style} className={className} {...rest}>
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

function DraggableCard({ app, onEdit, onDelete }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id })

  return (
    <ApplicationCard
      app={app}
      onEdit={onEdit}
      onDelete={onDelete}
      refProp={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      className="gap-3 py-4 hover:-translate-y-0.5 hover:shadow-md cursor-grab"
      {...attributes}
      {...listeners}
    />
  )
}

function ColumnSkeleton() {
  return (
    <div className="flex min-h-[320px] flex-col gap-4 rounded-2xl border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-9 rounded-full" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/3" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        ))}
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null)
  const [hoverStatus, setHoverStatus] = useState<api.Application['status'] | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<api.Application | null>(null)
  const [activeApplication, setActiveApplication] = useState<api.Application | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const isEditing = editingApplicationId !== null
  const normalizedCompanyFilter = companyFilter.trim().toLowerCase()
  const filteredApplications = applications.filter((application) => {
    const matchesStatus = filteredStatus === 'All' || application.status === filteredStatus
    const matchesCompany = normalizedCompanyFilter === '' ||
      application.companyName.toLowerCase().includes(normalizedCompanyFilter)
    return matchesStatus && matchesCompany
  })

  const loadApplications = async () => {
    if (!auth.token) return

    setIsLoading(true)

    try {
      const data = await api.listApplications(auth.token)
      setApplications(data)
    } catch (err) {
      toast.error(formatError(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [auth.token])

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingApplicationId(null)
    setFormData(EMPTY_FORM)
    setFormErrors({})
  }

  const openCreateDialog = () => {
    setEditingApplicationId(null)
    setFormData(EMPTY_FORM)
    setFormErrors({})
    setDialogOpen(true)
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
    setFormErrors({})
    setDialogOpen(true)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Please enter the job title you applied for.'
    } else if (formData.title.trim().length < 2) {
      errors.title = 'Job title must be at least 2 characters long.'
    }

    if (!formData.companyName.trim()) {
      errors.companyName = 'Please enter the company name.'
    } else if (formData.companyName.trim().length < 2) {
      errors.companyName = 'Company name must be at least 2 characters long.'
    }

    if (!formData.appliedDate) {
      errors.appliedDate = 'Please select the date you applied.'
    } else {
      const appliedDate = new Date(formData.appliedDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (appliedDate.getTime() > today.getTime()) {
        errors.appliedDate = 'Applied date cannot be in the future.'
      }
    }

    if (formData.notes.length > 1000) {
      errors.notes = 'Notes must be 1000 characters or fewer.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )

  const getStatusForOverId = (overId: string | number | undefined): api.Application['status'] | null => {
    if (overId == null) return null
    if ((STATUSES as readonly string[]).includes(overId as string)) {
      return overId as api.Application['status']
    }
    return applications.find((app) => app.id === overId)?.status ?? null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveApplication(applications.find((app) => app.id === event.active.id) ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setHoverStatus(getStatusForOverId(event.over?.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setHoverStatus(null)
    setActiveApplication(null)

    if (!auth.token || !over) return

    const application = applications.find((app) => app.id === active.id)
    const newStatus = getStatusForOverId(over.id)
    if (!application || !newStatus) return

    const previousApplications = applications
    const previousStatus = application.status

    setApplications((current) => {
      const activeIndex = current.findIndex((app) => app.id === application.id)
      const without = current.filter((app) => app.id !== application.id)
      const moved = { ...application, status: newStatus }

      let targetIndex: number
      if (over.id === application.id) {
        targetIndex = without.length
      } else if ((STATUSES as readonly string[]).includes(over.id as string)) {
        const lastIndexOfStatus = without.reduce(
          (lastIndex, app, index) => (app.status === newStatus ? index : lastIndex),
          -1
        )
        targetIndex = lastIndexOfStatus + 1
      } else {
        const overIndex = without.findIndex((app) => app.id === over.id)
        if (overIndex === -1) {
          targetIndex = without.length
        } else {
          const overIndexInCurrent = current.findIndex((app) => app.id === over.id)
          const movingDown = activeIndex < overIndexInCurrent
          targetIndex = movingDown ? overIndex + 1 : overIndex
        }
      }

      return [...without.slice(0, targetIndex), moved, ...without.slice(targetIndex)]
    })

    if (previousStatus === newStatus) return

    try {
      await api.updateApplication(application.id, { status: newStatus }, auth.token)
    } catch (err) {
      setApplications(previousApplications)
      toast.error(formatError(err))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!auth.token) return
    if (!validateForm()) return

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
        toast.success('Application updated')
      } else {
        await api.createApplication(
          {
            ...formData,
            appliedDate: new Date(formData.appliedDate).toISOString()
          } as api.CreateApplicationRequest,
          auth.token
        )
        toast.success('Application created')
      }

      closeDialog()
      await loadApplications()
    } catch (err) {
      toast.error(formatError(err))
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

    try {
      await api.deleteApplication(deleteCandidate.id, auth.token)
      toast.success('Application deleted')
      await loadApplications()
    } catch (err) {
      toast.error(formatError(err))
    } finally {
      setDeleteCandidate(null)
    }
  }

  const boardSections = STATUSES.map((status) => ({
    status,
    applications: filteredApplications.filter((application) => application.status === status)
  }))

  const initials = (auth.user?.email ?? '?').slice(0, 1).toUpperCase()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <h1 className="m-0 text-xl font-semibold">Job Application Tracker</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </span>
              <span className="hidden text-sm font-medium sm:inline">{auth.user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{auth.user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={auth.logout}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 p-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label>Filter status</Label>
              <Select
                value={filteredStatus}
                onValueChange={(value) => setFilteredStatus(value as 'All' | api.Application['status'])}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All statuses</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Filter company</Label>
              <Input
                type="text"
                placeholder="Search by company"
                className="w-[200px]"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={openCreateDialog}>New Application</Button>
        </div>

        <div className="w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {STATUSES.map((status) => (
                <ColumnSkeleton key={status} />
              ))}
            </div>
          ) : (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
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
                    <SortableContext
                      items={section.applications.map((app) => app.id)}
                      strategy={verticalListSortingStrategy}
                    >
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
                    </SortableContext>
                  </DroppableColumn>
                ))}
              </div>
              <DragOverlay>
                {activeApplication && (
                  <ApplicationCard
                    app={activeApplication}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    className="gap-3 py-4 shadow-lg scale-[1.03] cursor-grabbing"
                  />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit application' : 'New application'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the details of this application.'
                : 'Track a new job application.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Position Title</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                aria-invalid={!!formErrors.title}
              />
              {formErrors.title && (
                <p className="text-sm text-destructive">{formErrors.title}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="companyName">Company</Label>
              <Input
                id="companyName"
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                aria-invalid={!!formErrors.companyName}
              />
              {formErrors.companyName && (
                <p className="text-sm text-destructive">{formErrors.companyName}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as api.Application['status'] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="appliedDate">Applied Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="appliedDate"
                    type="button"
                    variant="outline"
                    aria-invalid={!!formErrors.appliedDate}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.appliedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {formData.appliedDate
                      ? format(new Date(`${formData.appliedDate}T00:00:00`), 'PPP')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.appliedDate ? new Date(`${formData.appliedDate}T00:00:00`) : undefined}
                    onSelect={(date) => {
                      if (!date) return
                      setFormData({ ...formData, appliedDate: format(date, 'yyyy-MM-dd') })
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              {formErrors.appliedDate && (
                <p className="text-sm text-destructive">{formErrors.appliedDate}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                aria-invalid={!!formErrors.notes}
                rows={3}
              />
              {formErrors.notes && (
                <p className="text-sm text-destructive">{formErrors.notes}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update Application' : 'Create Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteCandidate !== null} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{deleteCandidate?.title}</strong> at{' '}
              <strong className="text-foreground">{deleteCandidate?.companyName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
