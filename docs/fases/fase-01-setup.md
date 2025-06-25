# 🚀 Fase 01 - Setup e Configuração Inicial

## 📋 Objetivos da Fase

- Configurar ambiente de desenvolvimento
- Criar projeto Next.js com TypeScript
- Configurar Supabase
- Implementar estrutura base do projeto
- Configurar ferramentas de desenvolvimento

## ⏱️ Estimativa: 2-3 dias

## 🛠️ Tarefas Detalhadas

### 1. Configuração do Ambiente

#### 1.1 Pré-requisitos
```bash
# Verificar versões necessárias
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
git --version   # >= 2.0.0
```

#### 1.2 Criar Projeto Next.js
```bash
# Criar projeto com TypeScript
npx create-next-app@latest pet-connect --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd pet-connect

# Instalar dependências adicionais
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install lucide-react react-hook-form @hookform/resolvers zod
npm install zustand swr react-hot-toast
npm install date-fns clsx tailwind-merge
npm install react-dropzone react-big-calendar
npm install recharts

# Dependências de desenvolvimento
npm install -D @types/node @types/react @types/react-dom
npm install -D prettier prettier-plugin-tailwindcss
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### 2. Configuração do Supabase

#### 2.1 Criar Projeto no Supabase
1. Acessar [supabase.com](https://supabase.com)
2. Criar nova organização: "Pet Connect"
3. Criar novo projeto: "pet-connect-prod"
4. Anotar URL e chaves de API

#### 2.2 Configurar Variáveis de Ambiente
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Para desenvolvimento
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Para produção (configurar depois)
# NEXT_PUBLIC_APP_URL=https://petconnect.com
```

#### 2.3 Configurar Cliente Supabase
```typescript
// src/lib/supabase.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// Cliente para componentes do lado do cliente
export const createClient = () => createClientComponentClient<Database>()

// Cliente para componentes do servidor
export const createServerClient = () => createServerComponentClient<Database>({ cookies })

// Cliente para middleware
export const createMiddlewareClient = (req: any, res: any) => 
  createClientComponentClient<Database>({ req, res })
```

### 3. Estrutura do Projeto

#### 3.1 Organização de Pastas
```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── (auth)/            # Grupo de rotas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/       # Grupo de rotas do dashboard
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── pets/
│   │   ├── appointments/
│   │   ├── services/
│   │   ├── financial/
│   │   ├── reports/
│   │   └── layout.tsx
│   ├── admin/             # Painel administrativo
│   ├── api/               # API Routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base (botões, inputs, etc.)
│   ├── forms/            # Formulários específicos
│   ├── tables/           # Tabelas de dados
│   ├── charts/           # Gráficos e visualizações
│   └── layout/           # Componentes de layout
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
├── stores/               # Zustand stores
├── types/                # Definições de tipos TypeScript
└── utils/                # Funções utilitárias
```

#### 3.2 Configurar Tipos TypeScript
```typescript
// src/types/database.ts
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          cnpj: string | null
          plan_type: 'free' | 'premium'
          subscription_status: 'active' | 'inactive' | 'suspended'
          subscription_expires_at: string | null
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          cnpj?: string | null
          plan_type?: 'free' | 'premium'
          subscription_status?: 'active' | 'inactive' | 'suspended'
          subscription_expires_at?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          cnpj?: string | null
          plan_type?: 'free' | 'premium'
          subscription_status?: 'active' | 'inactive' | 'suspended'
          subscription_expires_at?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      // ... outras tabelas
    }
  }
}

// src/types/index.ts
export interface Company {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  cnpj?: string
  plan_type: 'free' | 'premium'
  subscription_status: 'active' | 'inactive' | 'suspended'
  subscription_expires_at?: string
  settings: any
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  company_id: string
  name: string
  email: string
  phone?: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'employee'
  permissions: any
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

// ... outros tipos
```

### 4. Configurações de Desenvolvimento

#### 4.1 ESLint e Prettier
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error"
  }
}
```

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

#### 4.2 Configurar Tailwind CSS
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Pet Connect Brand Colors
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Verde principal
          600: '#059669',
          700: '#047857', // Verde escuro
          800: '#065f46',
          900: '#064e3b',
        },
        gray: {
          50: '#f9fafb',  // Cinza claro
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280', // Cinza médio
          600: '#4b5563',
          700: '#374151', // Cinza escuro
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

#### 4.3 Configurar CSS Global
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 158 64% 52%;
    --primary-foreground: 210 40% 98%;
  }

  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg border border-gray-200 shadow-sm;
  }
}
```

### 5. Componentes Base

#### 5.1 Criar Componentes UI Base
```typescript
// src/components/ui/button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={clsx(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-500 text-white hover:bg-primary-600': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50': variant === 'outline',
            'text-gray-700 hover:bg-gray-100': variant === 'ghost',
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

#### 5.2 Layout Principal
```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pet Connect - Gestão para Pet Shops',
  description: 'Sistema completo de gestão para pet shops',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

### 6. Scripts de Desenvolvimento

#### 6.1 Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "db:types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts"
  }
}
```

### 7. Configuração do Git

#### 7.1 .gitignore
```
# Dependencies
node_modules/

# Production
.next/
out/
build/

# Environment variables
.env
.env.local
.env.production
.env.staging

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Supabase
.supabase/
```

#### 7.2 Commit Inicial
```bash
git init
git add .
git commit -m "feat: initial project setup with Next.js, TypeScript, and Supabase"
```

## ✅ Critérios de Aceitação

- [ ] Projeto Next.js criado e funcionando
- [ ] Supabase configurado e conectado
- [ ] Estrutura de pastas organizada
- [ ] Tipos TypeScript definidos
- [ ] Componentes UI base criados
- [ ] Tailwind CSS configurado com tema Pet Connect
- [ ] ESLint e Prettier funcionando
- [ ] Scripts de desenvolvimento configurados
- [ ] Repositório Git inicializado

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 02**: Implementar sistema de autenticação
2. Criar banco de dados no Supabase
3. Configurar políticas de segurança (RLS)

## 📝 Notas Importantes

- Manter as chaves do Supabase seguras
- Usar variáveis de ambiente para configurações
- Seguir convenções de nomenclatura consistentes
- Documentar mudanças importantes
- Testar configurações antes de prosseguir

---

**Tempo estimado: 2-3 dias**  
**Complexidade: Baixa**  
**Dependências: Nenhuma**