# To-Do List - Aplicativo de Gerenciamento de Tarefas

<div align="center">

![Ionic](https://img.shields.io/badge/Ionic-8.0-3880FF?style=for-the-badge&logo=ionic&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-7.4-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

Um aplicativo móvel híbrido completo para gerenciamento de tarefas e projetos, com armazenamento local SQLite.

[Características](#-características) •
[Tecnologias](#-stack-tecnológico) •
[Instalação](#-instalação) •
[Uso](#-uso) •
[Arquitetura](#-arquitetura) •
[API](#-api-e-modelos-de-dados)

</div>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Arquitetura](#-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API e Modelos de Dados](#-api-e-modelos-de-dados)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação](#-autenticação)
- [Testes](#-testes)
- [Build e Deploy](#-build-e-deploy)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Visão Geral

**To-Do List** é um aplicativo móvel híbrido desenvolvido com Ionic Framework e Angular, projetado para gerenciar tarefas pessoais e projetos colaborativos. O aplicativo utiliza SQLite para armazenamento local offline-first, garantindo que os dados estejam sempre disponíveis, mesmo sem conexão com a internet.

### Principais Destaques

- 📱 **Multiplataforma**: Funciona em iOS, Android e Web (PWA)
- 💾 **Offline-First**: Banco de dados SQLite local para acesso sem internet
- 🎨 **Design Moderno**: Interface intuitiva com Material Design e Ionic Components
- 🔐 **Seguro**: Sistema de autenticação com JWT e criptografia de dados
- ⚡ **Performance**: Otimizado para dispositivos móveis com lazy loading

---

## ✨ Características

### Gerenciamento de Tarefas
- ✅ Criação, edição e exclusão de tarefas
- 🏷️ Sistema de tags e categorias personalizadas
- 📅 Data de vencimento e lembretes
- ⭐ 4 níveis de prioridade (Baixa, Média, Alta, Urgente)
- 📊 4 status de tarefas (A Fazer, Em Progresso, Concluída, Cancelada)
- 🔍 Busca e filtragem avançada
- 📌 Anexação de notas e descrições

### Gerenciamento de Projetos
- 📁 Organização de tarefas em projetos
- 👥 Colaboração com múltiplos membros
- 🎨 Personalização com cores e ícones
- 📈 Visualização de progresso do projeto
- 📊 4 status de projeto (Ativo, Concluído, Arquivado, Em Espera)
- 👤 Sistema de permissões (Owner, Admin, Member, Viewer)

### Funcionalidades de Usuário
- 🔐 Autenticação segura com JWT
- 👤 Perfil personalizável com avatar
- ⚙️ Configurações de preferências
- 🌓 Alternância entre temas claro/escuro
- 🔔 Sistema de notificações

### Recursos Técnicos
- 💾 Armazenamento SQLite offline
- 🔄 Sincronização de dados (preparado para backend)
- 🚀 PWA (Progressive Web App)
- 📱 Suporte a gestos nativos
- 🎭 Animações fluidas
- 🔒 Proteção de rotas com Guards

---

## 🛠 Stack Tecnológico

### Frontend Framework
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Angular** | 20.0 | Framework principal para desenvolvimento web |
| **Ionic Framework** | 8.0 | Framework UI para aplicativos híbridos |
| **TypeScript** | 5.8 | Linguagem de programação tipada |
| **RxJS** | 7.8 | Programação reativa com Observables |

### Mobile & Capacitor
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Capacitor** | 7.4.3 | Runtime para aplicativos nativos |
| **Capacitor SQLite** | 7.0.1 | Plugin para banco de dados SQLite |
| **Capacitor App** | 7.1.0 | API de lifecycle do app |
| **Capacitor Haptics** | 7.0.2 | Feedback háptico |
| **Capacitor Keyboard** | 7.0.3 | Controle de teclado |
| **Capacitor Status Bar** | 7.0.3 | Customização da barra de status |

### Banco de Dados
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **SQLite** | - | Banco de dados local |
| **jeep-sqlite** | 2.8.0 | Web component para SQLite |
| **sql.js** | 1.11.0 | SQLite compilado para WebAssembly |

### Desenvolvimento
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Angular CLI** | 20.0 | Interface de linha de comando |
| **ESLint** | 9.16 | Linter para TypeScript/JavaScript |
| **Karma** | 6.4 | Test runner |
| **Jasmine** | 5.1 | Framework de testes |

### UI/UX
- **Ionicons** 7.0 - Biblioteca de ícones oficial do Ionic
- **SCSS** - Pré-processador CSS
- **CSS Variables** - Temas dinâmicos
- **Angular Animations** - Animações nativas

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

### Obrigatórios
- [Node.js](https://nodejs.org/) (versão 18.x ou superior)
- [npm](https://www.npmjs.com/) (versão 9.x ou superior) ou [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

### Recomendados
- [Ionic CLI](https://ionicframework.com/docs/cli) - Ferramentas de desenvolvimento Ionic
  ```bash
  npm install -g @ionic/cli
  ```
- [Angular CLI](https://angular.io/cli) - Ferramentas de desenvolvimento Angular
  ```bash
  npm install -g @angular/cli
  ```

### Para Desenvolvimento Mobile

#### Android
- [Android Studio](https://developer.android.com/studio) (última versão estável)
- Java Development Kit (JDK) 11 ou superior
- Android SDK (API 24+)
- Gradle 7.0+

#### iOS (somente macOS)
- [Xcode](https://developer.apple.com/xcode/) 14.0 ou superior
- CocoaPods
- Simulador iOS ou dispositivo físico

---

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd To-Do-List-Projeto-Mobile-
```

### 2. Instale as Dependências

```bash
npm install
```

ou se preferir usar yarn:

```bash
yarn install
```

### 3. Configure o Ambiente

O projeto já vem com configurações padrão em `src/environments/`, mas você pode personalizá-las:

**Desenvolvimento** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appVersion: '1.0.0',
  appName: 'To-Do App'
};
```

**Produção** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.seudominio.com/api',
  appVersion: '1.0.0',
  appName: 'To-Do App'
};
```

### 4. Inicialize o Banco de Dados

O banco de dados SQLite será criado automaticamente na primeira execução do aplicativo. As tabelas são criadas através do `DatabaseService`.

---

## 💻 Uso

### Desenvolvimento Web

Inicie o servidor de desenvolvimento:

```bash
npm start
```

ou

```bash
ionic serve
```

O aplicativo estará disponível em `http://localhost:8100`

### Desenvolvimento com Live Reload

```bash
ionic serve --lab
```

Abre o Ionic Lab para visualizar o app em diferentes plataformas simultaneamente.

### Build de Produção

```bash
npm run build
```

ou

```bash
ionic build --prod
```

Os arquivos compilados estarão em `www/`

---

## 📱 Desenvolvimento Mobile

### Android

#### Primeira Configuração

```bash
# Adiciona a plataforma Android (se ainda não foi adicionado)
ionic capacitor add android

# Sincroniza o código web com o projeto nativo
ionic capacitor sync android

# Compila o projeto
npm run build

# Copia os arquivos para o Android
ionic capacitor copy android
```

#### Executar no Dispositivo/Emulador

```bash
# Abre o Android Studio
ionic capacitor open android
```

No Android Studio:
1. Selecione um dispositivo/emulador
2. Clique em "Run" (ou pressione Shift + F10)

#### Build APK/AAB

No Android Studio:
- **APK Debug**: `Build > Build Bundle(s) / APK(s) > Build APK(s)`
- **AAB Release**: `Build > Generate Signed Bundle / APK`

### iOS (somente macOS)

#### Primeira Configuração

```bash
# Adiciona a plataforma iOS
ionic capacitor add ios

# Sincroniza o código
ionic capacitor sync ios

# Compila o projeto
npm run build

# Copia os arquivos para o iOS
ionic capacitor copy ios
```

#### Executar no Dispositivo/Simulador

```bash
# Abre o Xcode
ionic capacitor open ios
```

No Xcode:
1. Selecione um simulador ou dispositivo
2. Clique no botão "Run" (⌘ + R)

### Comandos Úteis

```bash
# Atualizar plugins nativos
npm install @capacitor/core @capacitor/cli
npx cap sync

# Verificar configuração do ambiente
npx cap doctor

# Limpar e reconstruir
npx cap sync --clean
```

---

## 🏗 Arquitetura

O projeto segue as melhores práticas de arquitetura Angular com uma estrutura modular e organizada.

### Princípios Arquiteturais

- **Standalone Components**: Componentes independentes sem módulos
- **Lazy Loading**: Carregamento sob demanda de páginas
- **Services Pattern**: Lógica de negócio centralizada em serviços
- **Reactive Programming**: Uso extensivo de RxJS e Observables
- **Offline-First**: Prioridade para funcionalidade offline com SQLite
- **Guard Protection**: Proteção de rotas com guards de autenticação

### Fluxo de Dados

```
┌─────────────┐
│  Component  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │ ◄─── Lógica de Negócio
└──────┬──────┘
       │
       ├──────────────┬────────────────┐
       ▼              ▼                ▼
┌─────────────┐ ┌──────────┐   ┌────────────┐
│   SQLite    │ │   API    │   │   Cache    │
│  Database   │ │ Backend  │   │  Service   │
└─────────────┘ └──────────┘   └────────────┘
```

### Camadas da Aplicação

1. **Presentation Layer** (Pages & Components)
   - Componentes de interface
   - Templates HTML
   - Estilos SCSS

2. **Business Logic Layer** (Services)
   - AuthService, TaskService, ProjectService
   - Regras de negócio
   - Validações

3. **Data Access Layer** (Services)
   - DatabaseService (SQLite)
   - ApiService (HTTP)
   - CacheService

4. **Cross-Cutting Concerns**
   - ErrorHandlerService
   - LoggerService
   - ToastService
   - LoadingService

---

## 📂 Estrutura do Projeto

```
To-Do-List-Projeto-Mobile-/
│
├── android/                    # Projeto Android nativo (Capacitor)
├── ios/                        # Projeto iOS nativo (Capacitor)
├── node_modules/               # Dependências do projeto
├── www/                        # Build de produção
│
├── src/
│   ├── app/
│   │   ├── components/         # Componentes globais
│   │   │   ├── profile-edit-modal/
│   │   │   └── project-form-modal/
│   │   │
│   │   ├── guards/             # Guards de roteamento
│   │   │   ├── auth.guard.ts
│   │   │   └── no-auth.guard.ts
│   │   │
│   │   ├── interceptors/       # HTTP Interceptors
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   │
│   │   ├── models/             # Interfaces e Models TypeScript
│   │   │   ├── user.model.ts
│   │   │   ├── task.model.ts
│   │   │   ├── project.model.ts
│   │   │   └── auth.model.ts
│   │   │
│   │   ├── pages/              # Páginas do aplicativo
│   │   │   ├── auth/           # Login e Registro
│   │   │   ├── tasks/          # Lista de tarefas
│   │   │   ├── task-form/      # Formulário de tarefa
│   │   │   ├── task-detail/    # Detalhes da tarefa
│   │   │   ├── projects/       # Lista de projetos
│   │   │   ├── project-detail/ # Detalhes do projeto
│   │   │   ├── settings/       # Configurações
│   │   │   └── database-debug/ # Debug do banco de dados
│   │   │
│   │   ├── services/           # Serviços da aplicação
│   │   │   ├── auth.service.ts           # Autenticação
│   │   │   ├── task.service.ts           # Gerenciamento de tarefas
│   │   │   ├── project.service.ts        # Gerenciamento de projetos
│   │   │   ├── database.service.ts       # SQLite
│   │   │   ├── sqlite-auth.service.ts    # Auth SQLite
│   │   │   ├── sqlite-task.service.ts    # Tasks SQLite
│   │   │   ├── sqlite-project.service.ts # Projects SQLite
│   │   │   ├── api.service.ts            # Comunicação HTTP
│   │   │   ├── user.service.ts           # Gerenciamento de usuários
│   │   │   ├── cache.service.ts          # Cache de dados
│   │   │   ├── preferences.service.ts    # Preferências do usuário
│   │   │   ├── toast.service.ts          # Notificações toast
│   │   │   ├── loading.service.ts        # Loading overlay
│   │   │   ├── logger.service.ts         # Logging
│   │   │   ├── error-handler.service.ts  # Tratamento de erros
│   │   │   ├── diagnostic.service.ts     # Diagnósticos
│   │   │   └── mock-backend.service.ts   # Mock para desenvolvimento
│   │   │
│   │   ├── shared/             # Módulos e componentes compartilhados
│   │   │   └── components/
│   │   │       └── task-item/  # Componente de item de tarefa
│   │   │
│   │   ├── tabs/               # Layout principal com tabs
│   │   │   ├── tabs.page.ts
│   │   │   ├── tabs.page.html
│   │   │   └── tabs.page.scss
│   │   │
│   │   ├── app.component.ts    # Componente raiz
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   └── app.routes.ts       # Configuração de rotas
│   │
│   ├── assets/                 # Recursos estáticos
│   │   ├── icon/               # Ícones do app
│   │   └── images/             # Imagens
│   │
│   ├── environments/           # Configurações de ambiente
│   │   ├── environment.ts      # Desenvolvimento
│   │   └── environment.prod.ts # Produção
│   │
│   ├── theme/                  # Temas e estilos
│   │   └── variables.scss      # Variáveis CSS
│   │
│   ├── global.scss             # Estilos globais
│   ├── index.html              # HTML principal
│   ├── main.ts                 # Ponto de entrada da aplicação
│   ├── polyfills.ts            # Polyfills
│   └── test.ts                 # Configuração de testes
│
├── .angular/                   # Cache do Angular
├── .gitignore                  # Arquivos ignorados pelo Git
├── angular.json                # Configuração do Angular
├── capacitor.config.ts         # Configuração do Capacitor
├── ionic.config.json           # Configuração do Ionic
├── karma.conf.js               # Configuração do Karma (testes)
├── package.json                # Dependências e scripts
├── tsconfig.json               # Configuração do TypeScript
├── tsconfig.app.json           # TypeScript para aplicação
├── tsconfig.spec.json          # TypeScript para testes
└── README.md                   # Este arquivo
```

---

## 📊 API e Modelos de Dados

### Modelos de Dados

#### IUser (Usuário)

```typescript
interface IUser {
  id: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  dataCriacao: Date | string;
  dataAtualizacao: Date | string;
}
```

#### ITask (Tarefa)

```typescript
enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

interface ITask {
  id: string;
  titulo: string;
  descricao?: string;
  status: TaskStatus;
  prioridade: TaskPriority;
  dataVencimento?: Date | string;
  dataCriacao: Date | string;
  dataAtualizacao: Date | string;
  userId: string;
  projectId?: string;
  tags?: string[];
  cor?: string;
}
```

#### IProject (Projeto)

```typescript
enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
  ON_HOLD = 'ON_HOLD'
}

interface IProjectMember {
  userId: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  dataEntrada: Date | string;
}

interface IProject {
  id: string;
  nome: string;
  descricao?: string;
  status: ProjectStatus;
  dataCriacao: Date | string;
  dataAtualizacao: Date | string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  ownerId: string;
  tasks?: string[];
  members?: IProjectMember[];
  cor?: string;
  icon?: string;
}
```

### Endpoints da API (Preparado para Backend)

#### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Registro de novo usuário |
| POST | `/auth/login` | Login de usuário |
| POST | `/auth/logout` | Logout de usuário |
| POST | `/auth/refresh` | Atualizar token JWT |
| GET | `/auth/me` | Obter dados do usuário atual |

#### Tarefas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tasks` | Listar todas as tarefas |
| GET | `/tasks/:id` | Obter tarefa específica |
| POST | `/tasks` | Criar nova tarefa |
| PUT | `/tasks/:id` | Atualizar tarefa |
| DELETE | `/tasks/:id` | Excluir tarefa |
| GET | `/tasks/project/:projectId` | Tarefas de um projeto |

#### Projetos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/projects` | Listar todos os projetos |
| GET | `/projects/:id` | Obter projeto específico |
| POST | `/projects` | Criar novo projeto |
| PUT | `/projects/:id` | Atualizar projeto |
| DELETE | `/projects/:id` | Excluir projeto |
| POST | `/projects/:id/members` | Adicionar membro |
| DELETE | `/projects/:id/members/:userId` | Remover membro |

---

## 💾 Banco de Dados

### Esquema SQLite

O aplicativo utiliza SQLite para armazenamento local com as seguintes tabelas:

#### Tabela: users

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  avatarUrl TEXT,
  dataCriacao TEXT NOT NULL,
  dataAtualizacao TEXT NOT NULL
);
```

#### Tabela: tasks

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL,
  prioridade TEXT NOT NULL,
  dataVencimento TEXT,
  dataCriacao TEXT NOT NULL,
  dataAtualizacao TEXT NOT NULL,
  userId TEXT NOT NULL,
  projectId TEXT,
  tags TEXT,
  cor TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (projectId) REFERENCES projects(id)
);
```

#### Tabela: projects

```sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL,
  dataCriacao TEXT NOT NULL,
  dataAtualizacao TEXT NOT NULL,
  dataInicio TEXT,
  dataFim TEXT,
  ownerId TEXT NOT NULL,
  cor TEXT,
  icon TEXT,
  FOREIGN KEY (ownerId) REFERENCES users(id)
);
```

#### Tabela: project_members

```sql
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  userId TEXT NOT NULL,
  role TEXT NOT NULL,
  dataEntrada TEXT NOT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Serviços de Banco de Dados

- **DatabaseService**: Gerenciamento geral do banco SQLite
- **SqliteAuthService**: Operações de autenticação
- **SqliteTaskService**: CRUD de tarefas
- **SqliteProjectService**: CRUD de projetos

---

## 🔐 Autenticação

### Fluxo de Autenticação

1. **Registro**:
   - Usuário preenche formulário de registro
   - Senha é hasheada (preparado para bcrypt no backend)
   - Dados salvos no SQLite
   - Token JWT gerado

2. **Login**:
   - Usuário insere credenciais
   - Sistema valida email e senha
   - Token JWT gerado e armazenado
   - Redirecionamento para área autenticada

3. **Token Management**:
   - Access Token: Validade de 1 hora
   - Refresh Token: Validade de 7 dias
   - Auto-refresh quando o token expira

4. **Proteção de Rotas**:
   - `authGuard`: Protege rotas autenticadas
   - `noAuthGuard`: Bloqueia usuários logados em rotas públicas

### Guards

```typescript
// Exemplo de uso em rotas
{
  path: 'tasks',
  loadComponent: () => import('./pages/tasks/tasks.page'),
  canActivate: [authGuard]
}
```

---

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
ng test --watch
```

### Linting

```bash
# Verificar código
npm run lint

# Corrigir automaticamente
ng lint --fix
```

### Estrutura de Testes

```
src/
├── app/
│   ├── services/
│   │   ├── auth.service.spec.ts
│   │   ├── task.service.spec.ts
│   │   └── ...
│   └── pages/
│       ├── tasks/
│       │   └── tasks.page.spec.ts
│       └── ...
```

---

## 📦 Build e Deploy

### Build Web

```bash
# Build de produção
npm run build

# Build com análise de bundle
npm run build -- --stats-json
npx webpack-bundle-analyzer www/stats.json
```

### Build Android

```bash
# Build Debug APK
cd android
./gradlew assembleDebug

# Build Release AAB
./gradlew bundleRelease
```

O APK estará em: `android/app/build/outputs/apk/debug/`
O AAB estará em: `android/app/build/outputs/bundle/release/`

### Build iOS

No Xcode:
1. Product > Archive
2. Distribute App
3. Escolha método de distribuição (App Store, Ad Hoc, Enterprise)

### Deploy PWA

```bash
# Build de produção
npm run build

# Deploy para Firebase Hosting (exemplo)
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Deploy em Stores

#### Google Play Store
1. Criar conta de desenvolvedor
2. Gerar signed AAB
3. Upload através do Play Console
4. Preencher informações do app
5. Publicar

#### Apple App Store
1. Criar conta Apple Developer
2. Configurar App ID e certificados
3. Archive e upload via Xcode
4. Preencher informações no App Store Connect
5. Submeter para revisão

---

## 🎨 Customização

### Temas

Edite `src/theme/variables.scss` para personalizar cores:

```scss
:root {
  --ion-color-primary: #3880ff;
  --ion-color-secondary: #3dc2ff;
  --ion-color-tertiary: #5260ff;
  // ... outras cores
}
```

### Ícones e Splash Screen

```bash
# Gerar ícones e splash screens
npm install -g cordova-res
cordova-res ios --skip-config --copy
cordova-res android --skip-config --copy
```

Coloque os ícones originais em:
- `resources/icon.png` (1024x1024)
- `resources/splash.png` (2732x2732)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estas etapas:

1. **Fork o Projeto**
2. **Crie uma Branch para sua Feature**
   ```bash
   git checkout -b feature/MinhaNovaFeature
   ```
3. **Commit suas Mudanças**
   ```bash
   git commit -m 'Adiciona nova funcionalidade X'
   ```
4. **Push para a Branch**
   ```bash
   git push origin feature/MinhaNovaFeature
   ```
5. **Abra um Pull Request**

### Diretrizes

- Siga o style guide do Angular e TypeScript
- Escreva testes para novas funcionalidades
- Documente código complexo
- Mantenha commits atômicos e descritivos
- Atualize o README se necessário

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Desenvolvedor Principal** - *Desenvolvimento geral* - [Ricardo José Mendonça Filho](https://github.com/ricomf)
---

## 🙏 Agradecimentos

- [Ionic Framework Team](https://ionicframework.com/) - Framework UI incrível
- [Angular Team](https://angular.io/) - Framework robusto e moderno
- [Capacitor Team](https://capacitorjs.com/) - Bridge nativa poderosa
- Comunidade Open Source - Por todas as ferramentas e bibliotecas
- [Ionicons](https://ionic.io/ionicons) - Biblioteca de ícones

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [Ionic Documentation](https://ionicframework.com/docs)
- [Angular Documentation](https://angular.io/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Tutoriais Recomendados
- [Ionic Framework Tutorial](https://ionicframework.com/docs/intro/cli)
- [Angular Getting Started](https://angular.io/start)
- [SQLite with Capacitor](https://github.com/capacitor-community/sqlite)

### Comunidades
- [Ionic Forum](https://forum.ionicframework.com/)
- [Angular Discord](https://discord.gg/angular)
- [Stack Overflow - Ionic Tag](https://stackoverflow.com/questions/tagged/ionic-framework)

---

<div align="center">

**[⬆ Voltar ao topo](#to-do-list---aplicativo-de-gerenciamento-de-tarefas)**


</div>
