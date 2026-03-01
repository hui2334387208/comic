import { create } from 'zustand'

interface PanelForm {
  panelNumber: number
  sceneDescription: string
  dialogue: string
  cameraAngle: string
}

interface PanelModalStore {
  isOpen: boolean
  form: PanelForm
  open: (defaultPanelNumber: number) => void
  close: () => void
  updateForm: (field: keyof PanelForm, value: string | number) => void
}

export const usePanelModalStore = create<PanelModalStore>((set) => ({
  isOpen: false,
  form: {
    panelNumber: 1,
    sceneDescription: '',
    dialogue: '',
    cameraAngle: 'normal',
  },
  open: (defaultPanelNumber: number) =>
    set({
      isOpen: true,
      form: {
        panelNumber: defaultPanelNumber,
        sceneDescription: '',
        dialogue: '',
        cameraAngle: 'normal',
      },
    }),
  close: () =>
    set({
      isOpen: false,
      form: {
        panelNumber: 1,
        sceneDescription: '',
        dialogue: '',
        cameraAngle: 'normal',
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
