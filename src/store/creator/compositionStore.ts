import { create } from 'zustand'

interface CompositionForm {
  name: string
  description: string
  style: string
}

interface CompositionModalStore {
  isOpen: boolean
  form: CompositionForm
  open: (defaultName: string) => void
  close: () => void
  updateForm: (field: keyof CompositionForm, value: string) => void
}

export const useCompositionModalStore = create<CompositionModalStore>((set) => ({
  isOpen: false,
  form: {
    name: '',
    description: '',
    style: 'default',
  },
  open: (defaultName: string) =>
    set({
      isOpen: true,
      form: {
        name: defaultName,
        description: '',
        style: 'default',
      },
    }),
  close: () =>
    set({
      isOpen: false,
      form: {
        name: '',
        description: '',
        style: 'default',
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
