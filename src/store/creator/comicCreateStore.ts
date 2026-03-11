import { create } from 'zustand'

interface Panel {
  id: number
  panelNumber?: number
  sceneDescription?: string
  dialogue?: string
  narration?: string
  emotion?: string
  cameraAngle?: string
  characters?: string
}

interface Page {
  id: number
  pageLayout?: string
  panelCount?: number
  panels: Panel[]
}

interface Episode {
  id: number
  name: string
  description?: string
  pages: Page[]
}

interface ComicInfo {
  title: string
  description: string
  coverImage?: string
  style?: number
  category?: number
  tags: number[]
  prompt: string
}

interface ComicCreateState {
  // 漫画基本信息
  comicInfo: ComicInfo
  
  // 话、页、分镜数据
  episodes: Episode[]
  currentEpisode: number
  currentPage: number
  
  // 生成状态
  isGenerating: boolean
  isGeneratingEpisode: boolean
  isGeneratingPage: boolean
  isGeneratingPanel: boolean
  
  // Actions
  setComicInfo: (info: Partial<ComicInfo>) => void
  setPrompt: (prompt: string) => void
  
  // Episode actions
  addEpisode: (episode: Episode) => void
  updateEpisode: (index: number, episode: Partial<Episode>) => void
  deleteEpisode: (index: number) => void
  setCurrentEpisode: (index: number) => void
  
  // Page actions
  addPage: (episodeIndex: number, page: Page) => void
  updatePage: (episodeIndex: number, pageIndex: number, page: Partial<Page>) => void
  deletePage: (episodeIndex: number, pageIndex: number) => void
  setCurrentPage: (index: number) => void
  
  // Panel actions
  addPanel: (episodeIndex: number, pageIndex: number, panel: Panel) => void
  updatePanel: (episodeIndex: number, pageIndex: number, panelIndex: number, panel: Partial<Panel>) => void
  deletePanel: (episodeIndex: number, pageIndex: number, panelIndex: number) => void
  
  // Generation state actions
  setIsGenerating: (value: boolean) => void
  setIsGeneratingEpisode: (value: boolean) => void
  setIsGeneratingPage: (value: boolean) => void
  setIsGeneratingPanel: (value: boolean) => void
  
  // Reset
  reset: () => void
}

const initialState = {
  comicInfo: {
    title: '',
    description: '',
    coverImage: '',
    style: undefined,
    category: undefined,
    tags: [],
    prompt: '',
  },
  episodes: [],
  currentEpisode: 0,
  currentPage: 0,
  isGenerating: false,
  isGeneratingEpisode: false,
  isGeneratingPage: false,
  isGeneratingPanel: false,
}

export const useComicCreateStore = create<ComicCreateState>((set) => ({
  ...initialState,
  
  setComicInfo: (info) =>
    set((state) => ({
      comicInfo: { ...state.comicInfo, ...info },
    })),
  
  setPrompt: (prompt) =>
    set((state) => ({
      comicInfo: { ...state.comicInfo, prompt },
    })),
  
  addEpisode: (episode) =>
    set((state) => ({
      episodes: [...state.episodes, episode],
    })),
  
  updateEpisode: (index, episode) =>
    set((state) => ({
      episodes: state.episodes.map((ep, i) =>
        i === index ? { ...ep, ...episode } : ep
      ),
    })),
  
  deleteEpisode: (index) =>
    set((state) => {
      const newEpisodes = state.episodes.filter((_, i) => i !== index)
      return {
        episodes: newEpisodes,
        currentEpisode: state.currentEpisode >= newEpisodes.length 
          ? Math.max(0, newEpisodes.length - 1) 
          : state.currentEpisode,
        currentPage: 0
      }
    }),
  
  setCurrentEpisode: (index) =>
    set({ currentEpisode: index, currentPage: 0 }),
  
  addPage: (episodeIndex, page) =>
    set((state) => ({
      episodes: state.episodes.map((ep, i) =>
        i === episodeIndex
          ? { ...ep, pages: [...ep.pages, page] }
          : ep
      ),
    })),
  
  updatePage: (episodeIndex, pageIndex, page) =>
    set((state) => ({
      episodes: state.episodes.map((ep, i) =>
        i === episodeIndex
          ? {
              ...ep,
              pages: ep.pages.map((p, j) =>
                j === pageIndex ? { ...p, ...page } : p
              ),
            }
          : ep
      ),
    })),
  
  deletePage: (episodeIndex, pageIndex) =>
    set((state) => ({
      episodes: state.episodes.map((ep, i) =>
        i === episodeIndex
          ? {
              ...ep,
              pages: ep.pages.filter((_, j) => j !== pageIndex)
            }
          : ep
      ),
      currentPage: state.currentPage >= state.episodes[episodeIndex]?.pages.length - 1
        ? Math.max(0, (state.episodes[episodeIndex]?.pages.length || 1) - 2)
        : state.currentPage
    })),
  
  setCurrentPage: (index) =>
    set({ currentPage: index }),
  
  addPanel: (episodeIndex, pageIndex, panel) =>
    set((state) => ({
      episodes: state.episodes.map((ep, i) =>
        i === episodeIndex
          ? {
              ...ep,
              pages: ep.pages.map((p, j) =>
                j === pageIndex
                  ? { ...p, panels: [...p.panels, panel] }
                  : p
              ),
            }
          : ep
      ),
    })),
  
  updatePanel: (episodeIndex, pageIndex, panelIndex, panel) =>
    set((state) => ({
      episodes: state.episodes.map((ep, i) =>
        i === episodeIndex
          ? {
              ...ep,
              pages: ep.pages.map((p, j) =>
                j === pageIndex
                  ? {
                      ...p,
                      panels: p.panels.map((pan, k) =>
                        k === panelIndex ? { ...pan, ...panel } : pan
                      ),
                    }
                  : p
              ),
            }
          : ep
      ),
    })),
  
  deletePanel: (episodeIndex, pageIndex, panelIndex) =>
    set((state) => ({
      episodes: state.episodes.map((ep, i) =>
        i === episodeIndex
          ? {
              ...ep,
              pages: ep.pages.map((p, j) =>
                j === pageIndex
                  ? {
                      ...p,
                      panels: p.panels.filter((_, k) => k !== panelIndex)
                    }
                  : p
              ),
            }
          : ep
      ),
    })),
  
  setIsGenerating: (value) => set({ isGenerating: value }),
  setIsGeneratingEpisode: (value) => set({ isGeneratingEpisode: value }),
  setIsGeneratingPage: (value) => set({ isGeneratingPage: value }),
  setIsGeneratingPanel: (value) => set({ isGeneratingPanel: value }),
  
  reset: () => set(initialState),
}))
