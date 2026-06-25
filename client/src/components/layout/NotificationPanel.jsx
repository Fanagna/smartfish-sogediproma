import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAsRead, markAllAsRead, createTestNotification } from '../../services/notificationService'
import { FiBell, FiCheckCircle, FiAlertTriangle, FiInfo, FiX, FiAlertCircle, FiSend } from 'react-icons/fi'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  info: { icon: FiInfo, bg: 'bg-accent/10', color: 'text-accent' },
  success: { icon: FiCheckCircle, bg: 'bg-success/10', color: 'text-success' },
  warning: { icon: FiAlertTriangle, bg: 'bg-warning/10', color: 'text-warning' },
  error: { icon: FiAlertCircle, bg: 'bg-danger/10', color: 'text-danger' }
}

function NotificationItem({ notif, onMarkRead }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info
  const Icon = cfg.icon
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'À l\'instant'
    if (mins < 60) return `Il y a ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Il y a ${hours}h`
    const days = Math.floor(hours / 24)
    return `Il y a ${days}j`
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${
        notif.read ? 'opacity-60' : 'hover:bg-theme-surface'
      }`}
      onClick={() => {
        if (!notif.read) onMarkRead(notif.id)
      }}
    >
      <div className={`p-1.5 rounded-lg shrink-0 ${cfg.bg} ${cfg.color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs ${notif.read ? 'text-theme-tertiary' : 'text-theme-primary font-medium'}`}>
          {notif.message}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          <span className="text-[10px] text-theme-muted">{timeAgo(notif.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

export default function NotificationPanel({ onClose }) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 20 }),
    refetchInterval: 30000
  })

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Toutes les notifications marquées comme lues')
    }
  })

  const testMutation = useMutation({
    mutationFn: createTestNotification,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-header'] })
      toast.success('🔔 Notification test créée !')
    },
    onError: () => {
      toast.error('Erreur lors de la création de la notification test')
    }
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  return (
    <>      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="absolute right-0 top-full mt-2 w-80 z-40"
      >
        <div
          className="rounded-xl shadow-elevated"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-strong)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center gap-2">
              <FiBell className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-danger text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  className="p-1.5 rounded-lg hover:bg-theme-surface text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                  title="Tout marquer comme lu"
                >
                  <FiCheckCircle className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-theme-surface" style={{ color: 'var(--text-tertiary)' }}>
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar p-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-0.5">
                {notifications.map(n => (
                  <NotificationItem
                    key={n.id}
                    notif={n}
                    onMarkRead={(id) => markReadMutation.mutate(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <FiBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Aucune notification</p>
              </div>
            )}
          </div>

          {/* Footer — Bouton Test */}
          <div className="border-t p-3" style={{ borderColor: 'var(--border-default)' }}>
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                opacity: testMutation.isPending ? 0.6 : 1,
              }}
            >
              {testMutation.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSend className="w-3.5 h-3.5" />
              )}
              {testMutation.isPending ? 'Envoi...' : '🔔 Tester la notification temps réel'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
