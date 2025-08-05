import { 
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps, parsePageId as parsePageId_ } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

const parsePageId = (id: string | undefined | null): string | null => {
  try {
    return parsePageId_(id ?? '') as string | null
  } catch {
    return null
  }
}

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => parsePageId(link?.pageId))
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  console.log('[getPage] 함수 시작. 입력 pageId:', pageId);

  const validPageId = parsePageId(pageId)
  console.log('[getPage] parsePageId 결과:', validPageId);

  if (!validPageId) {
    console.error('❌ Invalid Notion page ID:', pageId);
    throw new Error(`❌ Invalid Notion page ID: ${pageId}`)
  }

  console.log('🛰️ [getPage] notion.getPage 호출 전:', validPageId)
  let recordMap;
  try {
    recordMap = await notion.getPage(validPageId);
    console.log('✅ notion.getPage returned');
  } catch (err) {
    console.error('❌ notion.getPage threw error:', err);
  }

  if (!recordMap) {
    console.error('❌ notion.getPage 결과 recordMap이 undefined입니다!');
    throw new Error('❌ notion.getPage 결과가 undefined');
  }

  console.log('🔍 block count:', Object.keys(recordMap.block || {}).length)
  console.log('recordMap.block keys:', Object.keys(recordMap.block || {}).slice(0,10))
  console.log('recordMap.collection keys:', Object.keys(recordMap.collection || {}).slice(0,10))
  console.log('✅ [getPage] 완료:', Object.keys(recordMap.block || {}).length, 'blocks')

  // navigationLinkPages 체크
  if (navigationStyle !== 'default') {
    console.log('[getPage] navigationStyle:', navigationStyle, '- getNavigationLinkPages 호출');
    const navigationLinkRecordMaps = await getNavigationLinkPages()
    console.log('[getPage] navigationLinkRecordMaps:', navigationLinkRecordMaps?.length);

    if (navigationLinkRecordMaps?.length) {
      console.log('[getPage] navigationLinkRecordMaps 병합 시작');
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
      console.log('[getPage] navigationLinkRecordMaps 병합 완료');
    } else {
      console.log('[getPage] navigationLinkRecordMaps 없음');
    }
  } else {
    console.log('[getPage] navigationStyle이 default라서 navigationLinkPages 호출 안함');
  }

  console.log('[getPage] 함수 종료');
  return recordMap;
}

// export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
//   const validPageId = parsePageId(pageId)

//   if (!validPageId) {
//     throw new Error(`❌ Invalid Notion page ID: ${pageId}`)
//   }

//   console.log('🛰️ [getPage] 호출됨:', validPageId)
//   let recordMap;
//   try {
//     recordMap = await notion.getPage(validPageId);
//     console.log('✅ notion.getPage returned');
//   } catch (err) {
//     console.error('❌ notion.getPage threw error:', err);
//   }
//   console.log('🔍 block count:', Object.keys(recordMap.block || {}).length)
//   console.log('recordMap.block keys:', Object.keys(recordMap.block || {}).slice(0,10))
//   console.log('recordMap.collection keys:', Object.keys(recordMap.collection || {}).slice(0,10))
//   console.log('✅ [getPage] 완료:', Object.keys(recordMap.block || {}).length, 'blocks')

//   if (navigationStyle !== 'default') {
//     const navigationLinkRecordMaps = await getNavigationLinkPages()

//     if (navigationLinkRecordMaps?.length) {
//       recordMap = navigationLinkRecordMaps.reduce(
//         (map, navigationLinkRecordMap) =>
//           mergeRecordMaps(map, navigationLinkRecordMap),
//         recordMap
//       )
//     }
//   }

//   if (isPreviewImageSupportEnabled) {
//     const previewImageMap = await getPreviewImageMap(recordMap)
//     ;(recordMap as any).preview_images = previewImageMap
//   }

//   await getTweetsMap(recordMap)

//   return recordMap
// }

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
