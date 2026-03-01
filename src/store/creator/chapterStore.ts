import { create } from 'zustand'

interface ChapterForm {
  title: string
  description: string
}

interface ChapterModalStore {
  isOpen: boolean
  form: ChapterForm
  open: (defaultTitle: string) => void
  close: () => void
  updateForm: (field: keyof ChapterForm, value: string) => void
}

export const useChapterModalStore = create<ChapterModalStore>((set) => ({
  isOpen: false,
  form: {
    title: '',
    description: '',
  },
  open: (defaultTitle: string) =>
    set({
      isOpen: true,
      form: {
        title: defaultTitle,
        description: '',
      },
    }),
  close: () =>
    set({
      isOpen: false,
      form: {
        title: '',
        description: '',
      },
    }),
  updateForm: (field, value) =>
    set((state) => ({
      form: {
        ...state.form,
        [field]: value,
      },
    })),
}))
