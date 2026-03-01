import { create } from 'zustand'

interface CreateComicStore {
  createModalOpen: boolean
  openCreateModal: () => void
  closeCreateModal: () => void
}

export const useCreateComicStore = create<CreateComicStore>((set) => ({
  createModalOpen: false,
  openCreateModal: () => set({ createModalOpen: true }),
  closeCreateModal: () => set({ createModalOpen: false }),
}))
