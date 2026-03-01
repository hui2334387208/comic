import { create } from 'zustand'

interface VolumeForm {
  name: string
  title: string
  description: string
  coverImage: string
}

interface VolumeModalStore {
  isOpen: boolean
  form: VolumeForm
  open: (defaultTitle: string) => void
  close: () => void
  updateForm: (field: keyof VolumeForm, value: string) => void
  reset: () => void
}

const initialForm: VolumeForm = {
  name: '',
  title: '',
  description: '',
  coverImage: ''
}

export const useVolumeModalStore = create<VolumeModalStore>((set) => ({
  isOpen: false,
  form: initialForm,
  
  open: (defaultTitle: string) => {
    set({
      isOpen: true,
      form: {
        name: defaultTitle,
        title: defaultTitle,
        description: '',
        coverImage: ''
      }
    })
  },
  
  close: () => set({ isOpen: false }),
  
  updateForm: (field, value) => {
    set((state) => ({
      form: {
        ...state.form,
        [field]: value
      }
    }))
  },
  
  reset: () => set({ form: initialForm })
}))
