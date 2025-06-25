# Fase 11: Módulo Administrativo

## Objetivos
- Implementar sistema de gestão de usuários e permissões
- Criar painel de configurações da empresa
- Implementar logs de auditoria e monitoramento
- Desenvolver sistema de backup e restauração
- Criar relatórios de uso e performance

## Tempo Estimado
**7-8 dias**

## Tarefas Detalhadas

### 1. Sistema de Gestão de Usuários

#### 1.1 Estrutura de Permissões
```sql
-- Criar tabela de roles/funções
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Criar tabela de permissões de usuários
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, role_id)
);

-- RLS para roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company roles" ON roles
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage roles" ON roles
  FOR ALL USING (
    company_id IN (
      SELECT u.company_id FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.permissions->>'admin' = 'true'
      AND ur.is_active = TRUE
    )
  );

-- Função para verificar permissões
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.id = user_uuid
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND (r.permissions->>permission_name = 'true' OR r.permissions->>'admin' = 'true')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir roles padrão
INSERT INTO roles (company_id, name, description, permissions, is_system_role)
SELECT 
  c.id,
  'Administrador',
  'Acesso total ao sistema',
  '{
    "admin": true,
    "users_manage": true,
    "clients_manage": true,
    "pets_manage": true,
    "appointments_manage": true,
    "services_manage": true,
    "financial_manage": true,
    "reports_view": true,
    "settings_manage": true
  }'::jsonb,
  true
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.name = 'Administrador'
);

INSERT INTO roles (company_id, name, description, permissions, is_system_role)
SELECT 
  c.id,
  'Funcionário',
  'Acesso básico para atendimento',
  '{
    "clients_view": true,
    "clients_create": true,
    "clients_edit": true,
    "pets_view": true,
    "pets_create": true,
    "pets_edit": true,
    "appointments_view": true,
    "appointments_create": true,
    "appointments_edit": true,
    "services_view": true,
    "financial_view": true
  }'::jsonb,
  true
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.name = 'Funcionário'
);
```

#### 1.2 Página de Gestão de Usuários
```typescript
// src/app/(dashboard)/admin/usuarios/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  UserPlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { UserForm } from '@/components/admin/user-form'
import { UserRoleModal } from '@/components/admin/user-role-modal'

interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  is_active: boolean
  last_sign_in_at?: string
  created_at: string
  roles: Array<{
    id: string
    name: string
    permissions: Record<string, boolean>
  }>
}

export default function UsuariosPage() {
  const { company, user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadUsers()
    }
  }, [company?.id])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_roles!inner(
            role_id,
            roles(
              id,
              name,
              permissions
            )
          )
        `)
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformar dados para incluir roles
      const usersWithRoles = data.map(user => ({
        ...user,
        roles: user.user_roles.map(ur => ur.roles).filter(Boolean)
      }))

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (userData: { email: string; full_name: string; role_id: string }) => {
    try {
      // Criar convite de usuário
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(
        userData.email,
        {
          data: {
            full_name: userData.full_name,
            company_id: company!.id,
            role_id: userData.role_id
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      )

      if (error) throw error

      toast.success('Convite enviado com sucesso!')
      setShowUserForm(false)
      loadUsers()
    } catch (error) {
      console.error('Erro ao convidar usuário:', error)
      toast.error('Erro ao enviar convite')
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !isActive })
        .eq('id', userId)
        .eq('company_id', company!.id)

      if (error) throw error

      toast.success(`Usuário ${!isActive ? 'ativado' : 'desativado'} com sucesso`)
      loadUsers()
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie usuários e permissões da sua empresa
          </p>
        </div>
        <Button
          onClick={() => setShowUserForm(true)}
          className="flex items-center space-x-2"
        >
          <UserPlusIcon className="h-5 w-5" />
          <span>Convidar Usuário</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Função
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último Acesso
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.avatar_url}
                          alt={user.full_name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {role.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                    : 'Nunca'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowRoleModal(true)
                      }}
                    >
                      <ShieldCheckIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                      disabled={user.id === currentUser?.id}
                    >
                      {user.is_active ? (
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      ) : (
                        <PencilIcon className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar sua busca.' : 'Comece convidando um usuário.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUserForm && (
        <UserForm
          onClose={() => setShowUserForm(false)}
          onSubmit={handleInviteUser}
        />
      )}

      {showRoleModal && selectedUser && (
        <UserRoleModal
          user={selectedUser}
          onClose={() => {
            setShowRoleModal(false)
            setSelectedUser(null)
          }}
          onUpdate={loadUsers}
        />
      )}
    </div>
  )
}
```

### 2. Configurações da Empresa

#### 2.1 Página de Configurações
```typescript
// src/app/(dashboard)/admin/configuracoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@headlessui/react'
import { 
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BellIcon,
  ShieldCheckIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { clsx } from 'clsx'

interface CompanySettings {
  id: string
  name: string
  email: string
  phone: string
  address: string
  logo_url?: string
  business_hours: Record<string, { open: string; close: string; is_open: boolean }>
  timezone: string
  currency: string
  notification_settings: {
    email_notifications: boolean
    sms_notifications: boolean
    push_notifications: boolean
    marketing_emails: boolean
  }
  booking_settings: {
    advance_booking_days: number
    cancellation_hours: number
    confirmation_required: boolean
    allow_online_booking: boolean
  }
  payment_settings: {
    accepted_methods: string[]
    require_deposit: boolean
    deposit_percentage: number
    late_fee_enabled: boolean
    late_fee_amount: number
  }
}

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
]

export default function ConfiguracoesPage() {
  const { company } = useAuth()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('geral')
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
        .from('companies')
        .select('*')
        .eq('id', company!.id)
        .single()

      if (error) throw error

      setSettings(data)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('companies')
        .update({
          name: settings.name,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          logo_url: settings.logo_url,
          business_hours: settings.business_hours,
          timezone: settings.timezone,
          currency: settings.currency,
          notification_settings: settings.notification_settings,
          booking_settings: settings.booking_settings,
          payment_settings: settings.payment_settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', company!.id)

      if (error) throw error

      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (updates: Partial<CompanySettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates })
    }
  }

  const tabs = [
    { id: 'geral', name: 'Geral', icon: BuildingOfficeIcon },
    { id: 'horarios', name: 'Horários', icon: ClockIcon },
    { id: 'pagamentos', name: 'Pagamentos', icon: CurrencyDollarIcon },
    { id: 'notificacoes', name: 'Notificações', icon: BellIcon },
    { id: 'seguranca', name: 'Segurança', icon: ShieldCheckIcon }
  ]

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as configurações da sua empresa
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="flex space-x-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-4xl">
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Empresa</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa
                    </label>
                    <Input
                      value={settings.name}
                      onChange={(e) => updateSettings({ name: e.target.value })}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSettings({ email: e.target.value })}
                      placeholder="email@empresa.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <Input
                      value={settings.phone}
                      onChange={(e) => updateSettings({ phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuso Horário
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSettings({ timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/Manaus">Manaus (GMT-4)</option>
                      <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  <Textarea
                    value={settings.address}
                    onChange={(e) => updateSettings({ address: e.target.value })}
                    placeholder="Endereço completo da empresa"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'horarios' && (
            <div className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Horários de Funcionamento</h3>
                
                <div className="space-y-4">
                  {daysOfWeek.map((day) => {
                    const daySettings = settings.business_hours[day.key] || {
                      open: '09:00',
                      close: '18:00',
                      is_open: true
                    }
                    
                    return (
                      <div key={day.key} className="flex items-center space-x-4">
                        <div className="w-32">
                          <span className="text-sm font-medium text-gray-700">
                            {day.label}
                          </span>
                        </div>
                        
                        <Switch
                          checked={daySettings.is_open}
                          onChange={(enabled) => {
                            updateSettings({
                              business_hours: {
                                ...settings.business_hours,
                                [day.key]: { ...daySettings, is_open: enabled }
                              }
                            })
                          }}
                          className={clsx(
                            daySettings.is_open ? 'bg-primary-600' : 'bg-gray-200',
                            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out'
                          )}
                        >
                          <span
                            className={clsx(
                              daySettings.is_open ? 'translate-x-5' : 'translate-x-0',
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                            )}
                          />
                        </Switch>
                        
                        {daySettings.is_open && (
                          <>
                            <Input
                              type="time"
                              value={daySettings.open}
                              onChange={(e) => {
                                updateSettings({
                                  business_hours: {
                                    ...settings.business_hours,
                                    [day.key]: { ...daySettings, open: e.target.value }
                                  }
                                })
                              }}
                              className="w-32"
                            />
                            <span className="text-gray-500">às</span>
                            <Input
                              type="time"
                              value={daySettings.close}
                              onChange={(e) => {
                                updateSettings({
                                  business_hours: {
                                    ...settings.business_hours,
                                    [day.key]: { ...daySettings, close: e.target.value }
                                  }
                                })
                              }}
                              className="w-32"
                            />
                          </>
                        )}
                        
                        {!daySettings.is_open && (
                          <span className="text-gray-500 text-sm">Fechado</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Outras abas seriam implementadas de forma similar */}
        </div>
      </div>
    </div>
  )
}
```

### 3. Sistema de Logs de Auditoria

#### 3.1 Estrutura de Auditoria
```sql
-- Criar tabela de logs de auditoria
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
  resource_type VARCHAR(100) NOT NULL, -- 'client', 'pet', 'appointment', 'user', etc.
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_audit_logs_company_id ON audit_logs(company_id),
  INDEX idx_audit_logs_user_id ON audit_logs(user_id),
  INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id),
  INDEX idx_audit_logs_created_at ON audit_logs(created_at)
);

-- RLS para logs de auditoria
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company audit logs" ON audit_logs
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Função para criar log de auditoria
CREATE OR REPLACE FUNCTION create_audit_log(
  p_company_id UUID,
  p_user_id UUID,
  p_action VARCHAR(100),
  p_resource_type VARCHAR(100),
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    company_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    p_company_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para auditoria automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      NEW.company_id,
      auth.uid(),
      'create',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log(
      NEW.company_id,
      auth.uid(),
      'update',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log(
      OLD.company_id,
      auth.uid(),
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers nas tabelas principais
CREATE TRIGGER audit_clients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_pets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON pets
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_services_trigger
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

#### 3.2 Página de Logs de Auditoria
```typescript
// src/app/(dashboard)/admin/auditoria/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  old_values: Record<string, any>
  new_values: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string
  user: {
    full_name: string
    email: string
  }
}

const actionLabels = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  login: 'Login',
  logout: 'Logout'
}

const resourceLabels = {
  clients: 'Cliente',
  pets: 'Pet',
  appointments: 'Agendamento',
  services: 'Serviço',
  transactions: 'Transação',
  users: 'Usuário'
}

export default function AuditoriaPage() {
  const { company } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedResource, setSelectedResource] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadLogs()
    }
  }, [company?.id, page, selectedAction, selectedResource, dateFrom, dateTo])

  const loadLogs = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(full_name, email)
        `, { count: 'exact' })
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * 50, page * 50 - 1)

      if (selectedAction) {
        query = query.eq('action', selectedAction)
      }
      
      if (selectedResource) {
        query = query.eq('resource_type', selectedResource)
      }
      
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59')
      }

      const { data, error, count } = await query

      if (error) throw error

      setLogs(data || [])
      setTotalPages(Math.ceil((count || 0) / 50))
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      toast.error('Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = async () => {
    try {
      // Implementar exportação para CSV/Excel
      toast.success('Exportação iniciada')
    } catch (error) {
      console.error('Erro ao exportar logs:', error)
      toast.error('Erro ao exportar logs')
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800'
      case 'update': return 'bg-blue-100 text-blue-800'
      case 'delete': return 'bg-red-100 text-red-800'
      case 'login': return 'bg-purple-100 text-purple-800'
      case 'logout': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredLogs = logs.filter(log =>
    searchTerm === '' ||
    log.user?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resourceLabels[log.resource_type]?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe todas as atividades realizadas no sistema
          </p>
        </div>
        <Button
          onClick={exportLogs}
          className="flex items-center space-x-2"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          <span>Exportar</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Usuário, email, recurso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ação
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas as ações</option>
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recurso
            </label>
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos os recursos</option>
              {Object.entries(resourceLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recurso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {log.user?.full_name || 'Sistema'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {log.user?.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getActionColor(log.action)
                  }`}>
                    {actionLabels[log.action] || log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {resourceLabels[log.resource_type] || log.resource_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.ip_address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Implementar modal de detalhes
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum log encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar os filtros de busca.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Página {page} de {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

## Critérios de Aceitação

### ✅ Sistema de Gestão de Usuários
- [ ] Criação e gestão de roles/permissões
- [ ] Convite de novos usuários por email
- [ ] Ativação/desativação de usuários
- [ ] Atribuição de múltiplas funções
- [ ] Interface intuitiva de gestão

### ✅ Configurações da Empresa
- [ ] Configurações gerais (nome, contato, endereço)
- [ ] Horários de funcionamento por dia da semana
- [ ] Configurações de pagamento
- [ ] Preferências de notificação
- [ ] Upload de logo da empresa

### ✅ Sistema de Auditoria
- [ ] Logs automáticos de todas as operações
- [ ] Filtros avançados de busca
- [ ] Exportação de relatórios
- [ ] Detalhes de alterações (antes/depois)
- [ ] Rastreamento de IP e user agent

### ✅ Segurança e Permissões
- [ ] RLS implementado em todas as tabelas
- [ ] Verificação de permissões em tempo real
- [ ] Logs de tentativas de acesso
- [ ] Sessões seguras
- [ ] Criptografia de dados sensíveis

### ✅ Performance e UX
- [ ] Carregamento rápido das páginas
- [ ] Paginação eficiente
- [ ] Feedback visual para todas as ações
- [ ] Estados de loading apropriados
- [ ] Responsividade completa

## Próximos Passos

### Fase 12: Otimizações e PWA
- Performance optimization
- Service Workers
- Offline functionality
- Push notifications
- App manifest

### Fase 13: Testes e Deploy
- Testes unitários e integração
- Testes E2E com Playwright
- CI/CD pipeline
- Deploy em produção
- Monitoramento e alertas

## Notas Importantes

### 🔒 Segurança
- Implementar rate limiting para ações administrativas
- Logs de auditoria devem ser imutáveis
- Backup regular dos logs de auditoria
- Monitoramento de atividades suspeitas

### 📊 Performance
- Índices otimizados para consultas de auditoria
- Arquivamento de logs antigos
- Cache para configurações da empresa
- Lazy loading para listas grandes

### 🎯 Dicas de Implementação
1. **Permissões granulares**: Implemente permissões específicas por funcionalidade
2. **Auditoria completa**: Registre todas as operações importantes
3. **Interface intuitiva**: Torne a gestão de usuários simples e clara
4. **Backup automático**: Configure backups regulares dos dados
5. **Monitoramento**: Implemente alertas para atividades críticas

### 📋 Checklist de Desenvolvimento
- [ ] Criar estrutura de roles e permissões
- [ ] Implementar gestão de usuários
- [ ] Desenvolver página de configurações
- [ ] Implementar sistema de auditoria
- [ ] Configurar triggers automáticos
- [ ] Testes de segurança
- [ ] Documentação de permissões
- [ ] Deploy e monitoramento

---

**Tempo estimado total: 7-8 dias**

**Desenvolvedor responsável:** [Nome]

**Data de início:** [Data]

**Data prevista de conclusão:** [Data]