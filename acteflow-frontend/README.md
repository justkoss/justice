# acteFlow Frontend

Modern web interface for acteFlow document management system built with Next.js 14 and TypeScript.

## 🚀 Features

- ✅ **Next.js 14** - Latest App Router with Server Components
- ✅ **TypeScript** - Type-safe development
- ✅ **TailwindCSS** - Utility-first CSS with design system
- ✅ **Bilingual Support** - French and Arabic with RTL support
- ✅ **React Query** - Data fetching and caching
- ✅ **Zustand** - Lightweight state management
- ✅ **Radix UI** - Accessible, unstyled components
- ✅ **Lucide Icons** - Beautiful icon library
- ✅ **Sonner** - Toast notifications
- ✅ **React Hook Form + Zod** - Form validation
- ✅ **Axios** - HTTP client with interceptors

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Backend server running (see acteflow-backend)

## 🛠️ Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.local .env.local
```

Edit `.env.local` and update the API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3001`

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/          # Auth routes (login)
│   ├── (dashboard)/     # Dashboard routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # React components
│   ├── ui/             # Base UI components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── lib/                 # Utilities and configuration
│   ├── api.ts          # API client (axios)
│   ├── i18n.ts         # Internationalization
│   ├── utils.ts        # Utility functions
│   └── queryClient.tsx # React Query setup
├── store/               # State management (Zustand)
│   ├── authStore.ts    # Auth state
│   └── uiStore.ts      # UI state
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── styles/              # Global styles
└── locales/             # Translation files
    ├── fr/             # French translations
    └── ar/             # Arabic translations
```

## 🎨 Design System

The frontend follows the design specifications from `DESIGN_DOCUMENT.md`:

### Colors
- **Gold Accent:** `#d4af37` (Primary brand color)
- **Dark Theme:** Dark backgrounds with light text
- **Status Colors:** Yellow (pending), Blue (reviewing), Red (rejected), Green (stored)

### Typography
- **Font:** Inter (Latin), Noto Sans Arabic (Arabic)
- **Sizes:** 12px to 36px
- **Weights:** 400, 500, 600, 700

### Components
- Buttons with gold gradient
- Form inputs with dark theme
- Cards with subtle shadows
- Modals and dropdowns
- Toast notifications

## 🔐 Authentication

The app uses JWT tokens for authentication:

1. Login at `/login`
2. Token stored in localStorage
3. Auto-added to API requests via axios interceptor
4. Auto-redirect on 401 (unauthorized)

## 🌍 Internationalization

### Switching Languages
```typescript
import { useUIStore } from '@/store/uiStore';

const { language, setLanguage } = useUIStore();
setLanguage('ar'); // Switch to Arabic
```

### Using Translations
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <h1>{t('dashboard.title')}</h1>;
```

### RTL Support
Arabic language automatically enables RTL mode:
- `dir="rtl"` on `<html>` element
- Tailwind utilities reversed
- Layout mirrored

## 📡 API Integration

### Using the API Client
```typescript
import { api } from '@/lib/api';

// Login
const response = await api.login('username', 'password');

// Get documents
const documents = await api.getDocuments({ status: 'pending' });

// Approve document
await api.approveDocument(documentId);
```

### Using React Query
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['documents'],
  queryFn: () => api.getDocuments(),
});

// Mutate data
const mutation = useMutation({
  mutationFn: (id: number) => api.approveDocument(id),
  onSuccess: () => {
    // Refetch or invalidate queries
  },
});
```

## 🎯 User Roles

### Agent
- Upload documents
- View own documents
- Receive notifications

### Supervisor
- Review pending documents
- Approve/reject documents
- View assigned bureaus

### Admin
- Full system access
- User management
- Dashboard analytics
- Document tree

## 🧩 Key Components

### Layout Components
- `Header` - Top navigation bar
- `Sidebar` - Side navigation menu
- `Footer` - Footer component

### UI Components
- `Button` - Primary, secondary, danger variants
- `Input` - Form input fields
- `Select` - Dropdown selects
- `Modal` - Dialog modals
- `Card` - Content cards
- `Badge` - Status badges
- `Avatar` - User avatars

### Feature Components
- `DocumentList` - List of documents
- `DocumentViewer` - PDF viewer
- `ReviewPanel` - Review interface
- `UserTable` - User management table
- `DocumentTree` - Tree view
- `NotificationBell` - Notification center

## 🎨 Styling

### Using Tailwind
```tsx
<div className="bg-bg-secondary p-4 rounded-lg">
  <h2 className="text-xl font-semibold text-text-primary">Title</h2>
  <p className="text-text-secondary">Description</p>
</div>
```

### Using cn() Utility
```tsx
import { cn } from '@/lib/utils';

<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-gold-primary",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  Button
</button>
```

## 📊 State Management

### Auth State (Zustand)
```typescript
import { useAuthStore } from '@/store/authStore';

const { user, token, isAuthenticated, login, logout } = useAuthStore();
```

### UI State (Zustand)
```typescript
import { useUIStore } from '@/store/uiStore';

const { 
  sidebarOpen, 
  toggleSidebar, 
  addNotification,
  language,
  setLanguage 
} = useUIStore();
```

## 🔧 Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Type Check
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3000 |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | http://localhost:3000 |
| `NEXT_PUBLIC_APP_NAME` | Application name | acteFlow |
| `NEXT_PUBLIC_APP_VERSION` | Application version | 1.0.0 |

## 🚨 Troubleshooting

### Port Already in Use
Change port in package.json:
```json
"dev": "next dev -p 3001"
```

### API Connection Failed
- Verify backend is running on port 3000
- Check NEXT_PUBLIC_API_URL in `.env.local`
- Check CORS configuration in backend

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📚 Related Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Radix UI Documentation](https://www.radix-ui.com/)

## 🎯 Next Steps

Phase 1.2 Setup Complete! ✅

**Next Development Phases:**
1. Create auth pages (login)
2. Build dashboard layout
3. Implement document management
4. Add review workflow
5. Create user management
6. Build document tree view
7. Add WebSocket notifications

---

**Built with ❤️ for acteFlow Document Management System**
