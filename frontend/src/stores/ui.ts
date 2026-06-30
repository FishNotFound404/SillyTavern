import { create } from 'zustand'

export type Theme = 'dark' | 'light' | 'system'

export interface Toast {
  id: string
  message: string
  type?: 'info' | 'success' | 'error'
}

interface UIState {
  sidebarOpen: boolean
  theme: Theme
  activeNavItem: string
  toasts: Toast[]
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
  setActiveNavItem: (item: string) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: 'dark',
  activeNavItem: '/',
  toasts: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setActiveNavItem: (item) => set({ activeNavItem: item }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))