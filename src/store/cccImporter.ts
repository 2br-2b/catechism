import { generateCCCMeta, CCCMeta } from './cccMetaGenerator'
import { CCCStore } from './cccTypedefs'
import cccRaw from './ccc.json'

export interface CCCEnhancedStore {
  store: CCCStore
  extraMeta: CCCMeta
}

export const getCCCStore = (): CCCEnhancedStore => {
  const ccc = (cccRaw as unknown) as CCCStore
  const extraMeta = generateCCCMeta(ccc)

  return {
    store: ccc,
    extraMeta,
  }
}