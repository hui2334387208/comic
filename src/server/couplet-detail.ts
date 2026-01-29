import { fetchCoupletDetail } from '@/lib/couplet-utils'

export async function fetchCoupletDetailForServer(id: number, versionId: string | null = null) {
  try {
    const result = await fetchCoupletDetail(id, versionId)
    return result
  } catch (error) {
    console.error('Error fetching couplet detail for server:', error)
    return {
      success: false,
      data: null,
    }
  }
}

