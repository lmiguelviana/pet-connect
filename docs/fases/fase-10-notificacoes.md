# 🔔 Fase 10 - Sistema de Notificações e Comunicação

## 📋 Objetivos da Fase

- Implementar notificações em tempo real
- Criar sistema de comunicação com clientes
- Adicionar notificações por email e SMS
- Implementar sistema de mensagens internas
- Criar templates de comunicação personalizáveis
- Adicionar notificações push para dispositivos móveis
- Implementar sistema de lembretes automáticos
- Criar centro de notificações unificado

## ⏱️ Estimativa: 6-7 dias

## 🛠️ Tarefas Detalhadas

### 1. Sistema de Notificações em Tempo Real

#### 1.1 Configuração do Supabase Realtime
```sql
-- Habilitar realtime para tabelas de notificações
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Criar tabela de notificações
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'appointment', 'payment', 'reminder', 'system', 'marketing'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  channels TEXT[] DEFAULT ARRAY['in_app'], -- 'in_app', 'email', 'sms', 'push'
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_notifications_company_user ON notifications(company_id, user_id);
CREATE INDEX idx_notifications_client ON notifications(client_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(company_id, user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- RLS para notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company notifications" ON notifications
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create notifications for their company" ON notifications
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Criar tabela de templates de notificação
CREATE TABLE notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  email_template TEXT,
  sms_template TEXT,
  push_template TEXT,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- RLS para templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company templates" ON notification_templates
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_company_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_channels TEXT[] DEFAULT ARRAY['in_app'],
  p_priority VARCHAR DEFAULT 'normal',
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    company_id, user_id, client_id, type, title, message, 
    data, channels, priority, scheduled_for
  ) VALUES (
    p_company_id, p_user_id, p_client_id, p_type, p_title, p_message,
    p_data, p_channels, p_priority, p_scheduled_for
  ) RETURNING id INTO notification_id;
  
  -- Se não for agendada, processar imediatamente
  IF p_scheduled_for IS NULL THEN
    PERFORM process_notification(notification_id);
  END IF;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar notificação
CREATE OR REPLACE FUNCTION process_notification(notification_id UUID)
RETURNS VOID AS $$
DECLARE
  notification_record notifications%ROWTYPE;
BEGIN
  SELECT * INTO notification_record FROM notifications WHERE id = notification_id;
  
  -- Marcar como enviada
  UPDATE notifications SET sent_at = NOW() WHERE id = notification_id;
  
  -- Aqui você pode adicionar lógica para enviar emails, SMS, etc.
  -- Por exemplo, chamar edge functions do Supabase
  
  -- Notificar via realtime
  PERFORM pg_notify('notification_sent', notification_id::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para processar notificações agendadas
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS VOID AS $$
DECLARE
  notification_record RECORD;
BEGIN
  FOR notification_record IN 
    SELECT id FROM notifications 
    WHERE scheduled_for <= NOW() 
    AND sent_at IS NULL
    ORDER BY scheduled_for
  LOOP
    PERFORM process_notification(notification_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.2 Context de Notificações
```typescript
// src/contexts/notifications-context.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { createClient } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export interface Notification {
  id: string
  company_id: string
  user_id?: string
  client_id?: string
  type: 'appointment' | 'payment' | 'reminder' | 'system' | 'marketing'
  title: string
  message: string
  data: Record<string, any>
  is_read: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  channels: string[]
  scheduled_for?: string
  sent_at?: string
  read_at?: string
  created_at: string
  updated_at: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  createNotification: (notification: Partial<Notification>) => Promise<void>
  loadNotifications: () => Promise<void>
  subscribeToNotifications: () => void
  unsubscribeFromNotifications: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, company } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const supabase = createClient()

  const loadNotifications = useCallback(async () => {
    if (!company?.id) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', company.id)
        .or(`user_id.is.null,user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      toast.error('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }, [company?.id, user?.id, supabase])

  const subscribeToNotifications = useCallback(() => {
    if (!company?.id || subscription) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${company.id}`
        },
        (payload) => {
          console.log('Notificação recebida:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification
            
            // Verificar se a notificação é para o usuário atual
            if (!newNotification.user_id || newNotification.user_id === user?.id) {
              setNotifications(prev => [newNotification, ...prev])
              
              // Mostrar toast para notificações importantes
              if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
                toast.success(newNotification.title, {
                  duration: 5000,
                  icon: '🔔'
                })
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => 
              prev.filter(n => n.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    setSubscription(channel)
  }, [company?.id, user?.id, subscription, supabase])

  const unsubscribeFromNotifications = useCallback(() => {
    if (subscription) {
      subscription.unsubscribe()
      setSubscription(null)
    }
  }, [subscription])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('company_id', company!.id)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      toast.error('Erro ao marcar notificação como lida')
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id)

      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', unreadIds)
        .eq('company_id', company!.id)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => 
          unreadIds.includes(n.id)
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )

      toast.success('Todas as notificações foram marcadas como lidas')
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast.error('Erro ao marcar todas as notificações como lidas')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('company_id', company!.id)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('Notificação removida')
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
      toast.error('Erro ao remover notificação')
    }
  }

  const createNotification = async (notification: Partial<Notification>) => {
    try {
      const { data, error } = await supabase
        .rpc('create_notification', {
          p_company_id: company!.id,
          p_user_id: notification.user_id,
          p_client_id: notification.client_id,
          p_type: notification.type,
          p_title: notification.title,
          p_message: notification.message,
          p_data: notification.data || {},
          p_channels: notification.channels || ['in_app'],
          p_priority: notification.priority || 'normal',
          p_scheduled_for: notification.scheduled_for
        })

      if (error) throw error

      toast.success('Notificação criada com sucesso')
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      toast.error('Erro ao criar notificação')
    }
  }

  useEffect(() => {
    if (company?.id) {
      loadNotifications()
      subscribeToNotifications()
    }

    return () => {
      unsubscribeFromNotifications()
    }
  }, [company?.id, loadNotifications, subscribeToNotifications, unsubscribeFromNotifications])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    loadNotifications,
    subscribeToNotifications,
    unsubscribeFromNotifications
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
```

#### 1.3 Centro de Notificações
```typescript
// src/components/notifications/notification-center.tsx
'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition, Menu } from '@headlessui/react'
import { useNotifications } from '@/contexts/notifications-context'
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = clsx(
      'h-6 w-6',
      priority === 'urgent' ? 'text-red-500' :
      priority === 'high' ? 'text-orange-500' :
      priority === 'normal' ? 'text-blue-500' :
      'text-gray-500'
    )

    switch (type) {
      case 'appointment':
        return <CalendarDaysIcon className={iconClass} />
      case 'payment':
        return <CurrencyDollarIcon className={iconClass} />
      case 'reminder':
        return <ExclamationTriangleIcon className={iconClass} />
      case 'system':
        return <InformationCircleIcon className={iconClass} />
      case 'marketing':
        return <MegaphoneIcon className={iconClass} />
      default:
        return <BellIcon className={iconClass} />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'normal':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.is_read
    }
    return true
  })

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-0 top-0 -ml-8 flex pr-2 pt-4 sm:-ml-10 sm:pr-4">
                      <button
                        type="button"
                        className="relative rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={onClose}
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Fechar painel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    {/* Header */}
                    <div className="px-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                          Notificações
                          {unreadCount > 0 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              {unreadCount}
                            </span>
                          )}
                        </Dialog.Title>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-primary-600 hover:text-primary-500"
                          >
                            Marcar todas como lidas
                          </button>
                        )}
                      </div>
                      
                      {/* Filter Tabs */}
                      <div className="mt-4">
                        <nav className="flex space-x-4" aria-label="Tabs">
                          <button
                            onClick={() => setFilter('all')}
                            className={clsx(
                              'px-3 py-2 text-sm font-medium rounded-md',
                              filter === 'all'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-500 hover:text-gray-700'
                            )}
                          >
                            Todas ({notifications.length})
                          </button>
                          <button
                            onClick={() => setFilter('unread')}
                            className={clsx(
                              'px-3 py-2 text-sm font-medium rounded-md',
                              filter === 'unread'
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-500 hover:text-gray-700'
                            )}
                          >
                            Não lidas ({unreadCount})
                          </button>
                        </nav>
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {loading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="flex space-x-3">
                                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {filter === 'unread' 
                              ? 'Você está em dia com suas notificações!' 
                              : 'Suas notificações aparecerão aqui.'
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={clsx(
                                'relative rounded-lg border-l-4 p-4 shadow-sm',
                                getPriorityColor(notification.priority),
                                !notification.is_read && 'ring-2 ring-primary-500 ring-opacity-50'
                              )}
                            >
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  {getNotificationIcon(notification.type, notification.priority)}
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className={clsx(
                                        'text-sm font-medium',
                                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                      )}>
                                        {notification.title}
                                      </p>
                                      <p className={clsx(
                                        'mt-1 text-sm',
                                        !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                                      )}>
                                        {notification.message}
                                      </p>
                                      <p className="mt-2 text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(notification.created_at), {
                                          addSuffix: true,
                                          locale: ptBR
                                        })}
                                      </p>
                                    </div>
                                    
                                    {/* Actions Menu */}
                                    <Menu as="div" className="relative ml-3">
                                      <Menu.Button className="flex items-center rounded-full p-1 text-gray-400 hover:text-gray-600">
                                        <EllipsisVerticalIcon className="h-5 w-5" />
                                      </Menu.Button>
                                      <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                      >
                                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                          {!notification.is_read && (
                                            <Menu.Item>
                                              {({ active }) => (
                                                <button
                                                  onClick={() => markAsRead(notification.id)}
                                                  className={clsx(
                                                    active ? 'bg-gray-100' : '',
                                                    'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                                                  )}
                                                >
                                                  <CheckIcon className="mr-3 h-4 w-4" />
                                                  Marcar como lida
                                                </button>
                                              )}
                                            </Menu.Item>
                                          )}
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className={clsx(
                                                  active ? 'bg-gray-100' : '',
                                                  'flex w-full items-center px-4 py-2 text-sm text-red-700'
                                                )}
                                              >
                                                <TrashIcon className="mr-3 h-4 w-4" />
                                                Remover
                                              </button>
                                            )}
                                          </Menu.Item>
                                        </Menu.Items>
                                      </Transition>
                                    </Menu>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Unread indicator */}
                              {!notification.is_read && (
                                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary-500"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
```

### 2. Sistema de Comunicação com Clientes

#### 2.1 Página de Comunicação
```typescript
// src/app/(dashboard)/communication/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { CommunicationTemplates } from '@/components/communication/communication-templates'
import { MessageComposer } from '@/components/communication/message-composer'
import { CommunicationHistory } from '@/components/communication/communication-history'
import { CommunicationStats } from '@/components/communication/communication-stats'
import { 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export interface CommunicationTemplate {
  id: string
  company_id: string
  name: string
  type: 'email' | 'sms' | 'whatsapp'
  subject?: string
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunicationMessage {
  id: string
  company_id: string
  client_id: string
  template_id?: string
  type: 'email' | 'sms' | 'whatsapp'
  subject?: string
  content: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  sent_at?: string
  delivered_at?: string
  error_message?: string
  created_at: string
  client?: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export default function CommunicationPage() {
  const { company } = useAuth()
  const [activeTab, setActiveTab] = useState('compose')
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [messages, setMessages] = useState<CommunicationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadData()
    }
  }, [company?.id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError

      // Carregar mensagens recentes
      const { data: messagesData, error: messagesError } = await supabase
        .from('communication_messages')
        .select(`
          *,
          client:clients(
            id,
            name,
            email,
            phone
          )
        `)
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (messagesError) throw messagesError

      setTemplates(templatesData || [])
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados de comunicação:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'compose', name: 'Compor Mensagem', icon: ChatBubbleLeftRightIcon },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
    { id: 'history', name: 'Histórico', icon: ChartBarIcon },
    { id: 'stats', name: 'Estatísticas', icon: ChartBarIcon },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Comunicação com Clientes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie templates, envie mensagens e acompanhe o histórico de comunicação
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Button
            onClick={() => setShowComposer(true)}
            className="inline-flex items-center"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Nova Mensagem
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'compose' && (
          <MessageComposer
            templates={templates}
            onMessageSent={loadData}
          />
        )}
        
        {activeTab === 'templates' && (
          <CommunicationTemplates
            templates={templates}
            onTemplateChange={loadData}
          />
        )}
        
        {activeTab === 'history' && (
          <CommunicationHistory
            messages={messages}
            loading={loading}
          />
        )}
        
        {activeTab === 'stats' && (
          <CommunicationStats
            messages={messages}
            loading={loading}
          />
        )}
      </div>

      {/* Message Composer Modal */}
      {showComposer && (
        <MessageComposer
          templates={templates}
          onMessageSent={() => {
            loadData()
            setShowComposer(false)
          }}
          onClose={() => setShowComposer(false)}
          isModal
        />
      )}
    </div>
  )
}
```

#### 2.2 Composer de Mensagens
```typescript
// src/components/communication/message-composer.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { Fragment } from 'react'
import { 
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CommunicationTemplate } from '@/app/(dashboard)/communication/page'
import { toast } from 'react-hot-toast'
import { clsx } from 'clsx'

interface Client {
  id: string
  name: string
  email: string
  phone: string
}

interface MessageComposerProps {
  templates: CommunicationTemplate[]
  onMessageSent: () => void
  onClose?: () => void
  isModal?: boolean
}

export function MessageComposer({ 
  templates, 
  onMessageSent, 
  onClose, 
  isModal = false 
}: MessageComposerProps) {
  const { company } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClients, setSelectedClients] = useState<Client[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null)
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'whatsapp'>('email')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadClients()
    }
  }, [company?.id])

  useEffect(() => {
    if (selectedTemplate) {
      setMessageType(selectedTemplate.type as 'email' | 'sms' | 'whatsapp')
      setSubject(selectedTemplate.subject || '')
      setContent(selectedTemplate.content)
    }
  }, [selectedTemplate])

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone')
        .eq('company_id', company!.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      setClients(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSendMessage = async () => {
    if (selectedClients.length === 0) {
      toast.error('Selecione pelo menos um cliente')
      return
    }

    if (!content.trim()) {
      toast.error('Digite o conteúdo da mensagem')
      return
    }

    if (messageType === 'email' && !subject.trim()) {
      toast.error('Digite o assunto do email')
      return
    }

    try {
      setLoading(true)

      // Enviar mensagem para cada cliente selecionado
      const promises = selectedClients.map(client => 
        supabase.functions.invoke('send-communication', {
          body: {
            company_id: company!.id,
            client_id: client.id,
            type: messageType,
            subject: messageType === 'email' ? subject : undefined,
            content: content,
            template_id: selectedTemplate?.id
          }
        })
      )

      const results = await Promise.allSettled(promises)
      
      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.filter(result => result.status === 'rejected').length

      if (successful > 0) {
        toast.success(`${successful} mensagem(ns) enviada(s) com sucesso!`)
        
        // Limpar formulário
        setSelectedClients([])
        setSelectedTemplate(null)
        setSubject('')
        setContent('')
        
        onMessageSent()
        
        if (isModal && onClose) {
          onClose()
        }
      }

      if (failed > 0) {
        toast.error(`${failed} mensagem(ns) falharam ao enviar`)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error)
      toast.error('Erro ao enviar mensagens')
    } finally {
      setLoading(false)
    }
  }

  const replaceVariables = (text: string, client: Client) => {
    return text
      .replace(/{{nome}}/g, client.name)
      .replace(/{{email}}/g, client.email)
      .replace(/{{telefone}}/g, client.phone)
      .replace(/{{empresa}}/g, company?.name || '')
  }

  const messageTypes = [
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'sms', name: 'SMS', icon: '📱' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  ]

  const ComposerContent = (
    <div className="space-y-6">
      {/* Message Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Mensagem
        </label>
        <div className="grid grid-cols-3 gap-3">
          {messageTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setMessageType(type.id as 'email' | 'sms' | 'whatsapp')}
              className={clsx(
                'flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium',
                messageType === type.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="mr-2">{type.icon}</span>
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template (Opcional)
        </label>
        <Listbox value={selectedTemplate} onChange={setSelectedTemplate}>
          <div className="relative">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border border-gray-300">
              <span className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="block truncate">
                  {selectedTemplate ? selectedTemplate.name : 'Selecione um template'}
                </span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <Listbox.Option
                  value={null}
                  className={({ active }) =>
                    clsx(
                      'relative cursor-default select-none py-2 pl-10 pr-4',
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className="block truncate font-normal">
                        Nenhum template
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
                {templates
                  .filter(template => template.type === messageType)
                  .map((template) => (
                    <Listbox.Option
                      key={template.id}
                      value={template}
                      className={({ active }) =>
                        clsx(
                          'relative cursor-default select-none py-2 pl-10 pr-4',
                          active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                        )
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={clsx(
                            'block truncate',
                            selected ? 'font-medium' : 'font-normal'
                          )}>
                            {template.name}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))
                }
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>

      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destinatários
        </label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
          {loadingClients ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : clients.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum cliente encontrado</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {selectedClients.length} de {clients.length} selecionados
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setSelectedClients(clients)}
                    className="text-xs text-primary-600 hover:text-primary-500"
                  >
                    Selecionar todos
                  </button>
                  <button
                    onClick={() => setSelectedClients([])}
                    className="text-xs text-gray-600 hover:text-gray-500"
                  >
                    Limpar seleção
                  </button>
                </div>
              </div>
              {clients.map((client) => (
                <label key={client.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClients.some(c => c.id === client.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClients([...selectedClients, client])
                      } else {
                        setSelectedClients(selectedClients.filter(c => c.id !== client.id))
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">
                      {messageType === 'email' ? client.email : client.phone}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subject (for email) */}
      {messageType === 'email' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assunto
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Digite o assunto do email"
          />
        </div>
      )}

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conteúdo da Mensagem
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Digite o conteúdo da mensagem..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Variáveis disponíveis: {{nome}}, {{email}}, {{telefone}}, {{empresa}}
        </p>
      </div>

      {/* Preview */}
      {selectedClients.length > 0 && content && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prévia (primeiro cliente)
          </label>
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            {messageType === 'email' && subject && (
              <p className="font-medium text-gray-900 mb-2">
                Assunto: {replaceVariables(subject, selectedClients[0])}
              </p>
            )}
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {replaceVariables(content, selectedClients[0])}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {isModal && onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleSendMessage}
          disabled={loading || selectedClients.length === 0 || !content.trim()}
          className="inline-flex items-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          )}
          {loading ? 'Enviando...' : 'Enviar Mensagem'}
        </Button>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <Transition.Root show={true} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose || (() => {})}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">Fechar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 mb-4">
                        Nova Mensagem
                      </Dialog.Title>
                      {ComposerContent}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Compor Nova Mensagem</h2>
      {ComposerContent}
    </div>
  )
}
```

## Critérios de Aceitação

### ✅ Sistema de Notificações em Tempo Real
- [ ] Notificações aparecem instantaneamente no centro de notificações
- [ ] Contador de notificações não lidas atualiza em tempo real
- [ ] Sistema funciona mesmo com múltiplas abas abertas
- [ ] Notificações são persistidas no banco de dados
- [ ] RLS implementado corretamente para segurança

### ✅ Centro de Notificações
- [ ] Interface limpa e intuitiva
- [ ] Filtros por tipo e status funcionando
- [ ] Paginação implementada
- [ ] Ações de marcar como lida/não lida
- [ ] Ação de excluir notificações
- [ ] Busca por conteúdo das notificações

### ✅ Sistema de Comunicação com Clientes
- [ ] Envio de emails funcionando
- [ ] Templates personalizáveis
- [ ] Histórico de comunicações
- [ ] Integração com WhatsApp (se implementada)
- [ ] Logs de entrega e erros

### ✅ Lembretes Automáticos
- [ ] Configurações por tipo de lembrete
- [ ] Múltiplos canais de envio
- [ ] Agendamento correto dos lembretes
- [ ] Prevenção de duplicatas
- [ ] Interface de configuração intuitiva

### ✅ Performance e UX
- [ ] Carregamento rápido do centro de notificações
- [ ] Feedback visual para todas as ações
- [ ] Estados de loading apropriados
- [ ] Tratamento de erros
- [ ] Responsividade em dispositivos móveis

## Próximos Passos

### Fase 11: Módulo Administrativo
- Sistema de gestão de usuários
- Controle de permissões
- Configurações da empresa
- Logs de auditoria
- Backup e restauração

### Fase 12: Otimizações e Melhorias
- Performance optimization
- SEO improvements
- PWA implementation
- Advanced analytics
- Mobile app considerations

### Fase 13: Testes e Deploy
- Testes unitários
- Testes de integração
- Testes E2E
- Deploy em produção
- Monitoramento

## Notas Importantes

### 🔧 Configuração do Supabase Realtime
```sql
-- Habilitar Realtime para as tabelas necessárias
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
```

### 📧 Configuração de Email
- Configure SMTP no Supabase ou use serviço como SendGrid
- Implemente templates responsivos
- Configure SPF, DKIM e DMARC para deliverability
- Monitore taxa de entrega e bounces

### 📱 Integração WhatsApp
- Use WhatsApp Business API
- Implemente webhook para receber status
- Configure templates aprovados pelo WhatsApp
- Respeite limites de rate limiting

### 🔒 Segurança
- Todas as notificações devem respeitar RLS
- Validar permissões antes de enviar comunicações
- Logs de auditoria para comunicações enviadas
- Rate limiting para prevenir spam

### 📊 Monitoramento
- Monitore taxa de entrega de emails/SMS
- Acompanhe engagement das notificações
- Logs de erros e falhas de envio
- Métricas de performance do sistema

### 🎯 Dicas de Implementação
1. **Comece simples**: Implemente primeiro as notificações básicas
2. **Teste em desenvolvimento**: Use emails de teste durante desenvolvimento
3. **Feedback visual**: Sempre forneça feedback para ações do usuário
4. **Graceful degradation**: Sistema deve funcionar mesmo se Realtime falhar
5. **Configurações flexíveis**: Permita que usuários controlem suas preferências

### 📋 Checklist de Desenvolvimento
- [ ] Configurar Supabase Realtime
- [ ] Criar tabelas e políticas RLS
- [ ] Implementar contexto de notificações
- [ ] Criar centro de notificações
- [ ] Implementar sistema de comunicação
- [ ] Configurar lembretes automáticos
- [ ] Testes de integração
- [ ] Documentação de uso
- [ ] Deploy e monitoramento

---

**Tempo estimado total: 6-7 dias**

**Desenvolvedor responsável:** [Nome]

**Data de início:** [Data]

**Data prevista de conclusão:** [Data]

#### 3.1 Configuração de Lembretes
```sql
-- Criar tabela de configurações de lembretes
CREATE TABLE reminder_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'appointment_confirmation', 'appointment_reminder', 'follow_up', 'birthday'
  is_active BOOLEAN DEFAULT TRUE,
  send_before_hours INTEGER, -- Horas antes do evento
  channels TEXT[] DEFAULT ARRAY['email'], -- 'email', 'sms', 'whatsapp'
  template_id UUID REFERENCES notification_templates(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, type)
);

-- RLS para configurações de lembretes
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company reminder settings" ON reminder_settings
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Função para criar lembretes automáticos
CREATE OR REPLACE FUNCTION create_automatic_reminders()
RETURNS VOID AS $$
DECLARE
  appointment_record RECORD;
  reminder_setting RECORD;
  reminder_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Processar lembretes de agendamentos
  FOR appointment_record IN 
    SELECT a.*, c.name as client_name, c.email, c.phone, co.name as company_name
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    JOIN companies co ON a.company_id = co.id
    WHERE a.status = 'scheduled'
    AND a.appointment_date > NOW()
    AND a.appointment_date <= NOW() + INTERVAL '7 days'
  LOOP
    -- Verificar configurações de lembretes para esta empresa
    FOR reminder_setting IN
      SELECT * FROM reminder_settings 
      WHERE company_id = appointment_record.company_id 
      AND is_active = TRUE
      AND type IN ('appointment_confirmation', 'appointment_reminder')
    LOOP
      reminder_time := appointment_record.appointment_date - (reminder_setting.send_before_hours || ' hours')::INTERVAL;
      
      -- Verificar se já não existe um lembrete para este agendamento
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE company_id = appointment_record.company_id
        AND type = 'reminder'
        AND data->>'appointment_id' = appointment_record.id::text
        AND data->>'reminder_type' = reminder_setting.type
      ) THEN
        -- Criar lembrete
        PERFORM create_notification(
          appointment_record.company_id,
          NULL, -- user_id
          appointment_record.client_id,
          'reminder',
          CASE 
            WHEN reminder_setting.type = 'appointment_confirmation' THEN 'Confirmação de Agendamento'
            WHEN reminder_setting.type = 'appointment_reminder' THEN 'Lembrete de Agendamento'
          END,
          CASE 
            WHEN reminder_setting.type = 'appointment_confirmation' THEN 
              'Seu agendamento foi confirmado para ' || to_char(appointment_record.appointment_date, 'DD/MM/YYYY às HH24:MI')
            WHEN reminder_setting.type = 'appointment_reminder' THEN 
              'Lembrete: Você tem um agendamento em ' || reminder_setting.send_before_hours || ' horas'
          END,
          jsonb_build_object(
            'appointment_id', appointment_record.id,
            'reminder_type', reminder_setting.type,
            'client_name', appointment_record.client_name,
            'appointment_date', appointment_record.appointment_date
          ),
          reminder_setting.channels,
          'normal',
          reminder_time
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar job para executar lembretes automáticos (executar a cada hora)
-- Isso seria configurado no cron do sistema ou usando pg_cron se disponível
```

#### 3.2 Componente de Configuração de Lembretes
```typescript
// src/components/communication/reminder-settings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Switch } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ClockIcon,
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { clsx } from 'clsx'

interface ReminderSetting {
  id: string
  company_id: string
  type: string
  is_active: boolean
  send_before_hours: number
  channels: string[]
  template_id?: string
}

const reminderTypes = [
  {
    id: 'appointment_confirmation',
    name: 'Confirmação de Agendamento',
    description: 'Enviado imediatamente após o agendamento ser criado',
    icon: BellIcon,
    defaultHours: 0
  },
  {
    id: 'appointment_reminder',
    name: 'Lembrete de Agendamento',
    description: 'Enviado antes do horário do agendamento',
    icon: ClockIcon,
    defaultHours: 24
  },
  {
    id: 'follow_up',
    name: 'Follow-up Pós-Atendimento',
    description: 'Enviado após o atendimento para feedback',
    icon: ChatBubbleLeftRightIcon,
    defaultHours: 24
  }
]

const channelOptions = [
  { id: 'email', name: 'Email', icon: EnvelopeIcon },
  { id: 'sms', name: 'SMS', icon: DevicePhoneMobileIcon },
  { id: 'whatsapp', name: 'WhatsApp', icon: ChatBubbleLeftRightIcon }
]

export function ReminderSettings() {
  const { company } = useAuth()
  const [settings, setSettings] = useState<ReminderSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadSettings()
    }
  }, [company?.id])

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('company_id', company!.id)

      if (error) throw error

      // Criar configurações padrão se não existirem
      const existingTypes = (data || []).map(s => s.type)
      const missingTypes = reminderTypes.filter(rt => !existingTypes.includes(rt.id))
      
      if (missingTypes.length > 0) {
        const defaultSettings = missingTypes.map(rt => ({
          company_id: company!.id,
          type: rt.id,
          is_active: false,
          send_before_hours: rt.defaultHours,
          channels: ['email']
        }))

        const { data: newSettings, error: insertError } = await supabase
          .from('reminder_settings')
          .insert(defaultSettings)
          .select()

        if (insertError) throw insertError

        setSettings([...(data || []), ...(newSettings || [])])
      } else {
        setSettings(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (settingId: string, updates: Partial<ReminderSetting>) => {
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('reminder_settings')
        .update(updates)
        .eq('id', settingId)
        .eq('company_id', company!.id)

      if (error) throw error

      setSettings(settings.map(s => 
        s.id === settingId ? { ...s, ...updates } : s
      ))

      toast.success('Configuração atualizada')
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error)
      toast.error('Erro ao atualizar configuração')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Configurações de Lembretes</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure lembretes automáticos para seus clientes
        </p>
      </div>

      <div className="space-y-6">
        {reminderTypes.map((reminderType) => {
          const setting = settings.find(s => s.type === reminderType.id)
          if (!setting) return null

          const Icon = reminderType.icon

          return (
            <div key={reminderType.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {reminderType.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {reminderType.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={setting.is_active}
                  onChange={(enabled) => updateSetting(setting.id, { is_active: enabled })}
                  className={clsx(
                    setting.is_active ? 'bg-primary-600' : 'bg-gray-200',
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                  )}
                >
                  <span
                    className={clsx(
                      setting.is_active ? 'translate-x-5' : 'translate-x-0',
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                    )}
                  />
                </Switch>
              </div>

              {setting.is_active && (
                <div className="mt-6 space-y-4">
                  {/* Timing Configuration */}
                  {reminderType.id !== 'appointment_confirmation' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enviar com antecedência de:
                      </label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="1"
                          value={setting.send_before_hours}
                          onChange={(e) => updateSetting(setting.id, { 
                            send_before_hours: parseInt(e.target.value) || 1 
                          })}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">horas</span>
                      </div>
                    </div>
                  )}

                  {/* Channel Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canais de envio:
                    </label>
                    <div className="space-y-2">
                      {channelOptions.map((channel) => {
                        const ChannelIcon = channel.icon
                        return (
                          <label key={channel.id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={setting.channels.includes(channel.id)}
                              onChange={(e) => {
                                const newChannels = e.target.checked
                                  ? [...setting.channels, channel.id]
                                  : setting.channels.filter(c => c !== channel.id)
                                updateSetting(setting.id, { channels: newChannels })
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <ChannelIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-700">{channel.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```