import { create } from 'zustand'

interface PageForm {
  pageNumber: number
  pageLayout: string
}

interface PageModalStore {
  isOpen: boolean
  form: PageForm
  open: (defaultPageNumber: number) => void
  close: () => void
  updateForm: (field: keyof PageForm, value: string | number) => void
}

export const usePageModalStore = create<PageModalStore>((set) => ({
  isOpen: false,
  form: {
    pageNumber: 1,
    pageLayout: 'single',
  },
  open: (defaultPageNumber: number) =>
    set({
      isOpen: true,
      form: {
        pageNumber: defaultPageNumber,
        pageLayout: 'single',
      },
    }),
  close: () =>
    set({
      isOpen: false,
      form: {
        pageNumber: 1,
        pageLayout: 'single',
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
