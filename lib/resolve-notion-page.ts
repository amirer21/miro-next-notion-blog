import { type ExtendedRecordMap } from 'notion-types'
import { parsePageId } from 'notion-utils'

import type { PageProps } from './types'
import * as acl from './acl'
import { environment, pageUrlAdditions, pageUrlOverrides, site } from './config'
import { db } from './db'
import { getSiteMap } from './get-site-map'
import { getPage } from './notion'

export async function resolveNotionPage(
  domain: string,
  rawPageId?: string
): Promise<PageProps> {
  let pageId: string | undefined
  let recordMap: ExtendedRecordMap

  if (rawPageId && rawPageId !== 'index') {
    pageId = parsePageId(rawPageId)!
    console.log('🔍 resolveNotionPage: rawPageId →', rawPageId)
    console.log('🔍 parsed pageId:', pageId)

    if (!pageId) {
      const override = pageUrlOverrides[rawPageId] || pageUrlAdditions[rawPageId]
      if (override) {
        pageId = parsePageId(override)!
        console.log('🔁 used override pageId:', pageId)
      }
    }

    const useUriToPageIdCache = true
    const cacheKey = `uri-to-page-id:${domain}:${environment}:${rawPageId}`
    const cacheTTL = undefined

    if (!pageId && useUriToPageIdCache) {
      try {
        pageId = await db.get(cacheKey)
        console.log('💾 redis cache get:', cacheKey, '→', pageId)
      } catch (err: any) {
        console.warn('⚠️ redis get error:', err.message)
      }
    }

    if (pageId) {
      recordMap = await getPage(pageId)
      console.log('✅ getPage result for ID:', pageId)
      console.log('📦 collection keys:', Object.keys(recordMap?.collection || {}))
      console.log('📦 block keys:', Object.keys(recordMap?.block || {}))
    } else {
      const siteMap = await getSiteMap()
      pageId = siteMap?.canonicalPageMap[rawPageId]

      if (pageId) {
        recordMap = await getPage(pageId)
        console.log('📌 fallback getPage result:', pageId)
        console.log('📦 collection keys:', Object.keys(recordMap?.collection || {}))
        console.log('📦 block keys:', Object.keys(recordMap?.block || {}))

        if (useUriToPageIdCache) {
          try {
            await db.set(cacheKey, pageId, cacheTTL)
            console.log('💾 redis set:', cacheKey, '→', pageId)
          } catch (err: any) {
            console.warn('⚠️ redis set error:', err.message)
          }
        }
      } else {
        return {
          error: {
            message: `❌ Notion page not found for "${rawPageId}"`,
            statusCode: 404
          }
        }
      }
    }
  } else {
    // fallback: root page
    pageId = site.rootNotionPageId
    console.log('🏠 Using rootNotionPageId:', pageId)

    recordMap = await getPage(pageId)
    console.log('✅ getPage result for root ID:', pageId)
    console.log('📦 collection keys:', Object.keys(recordMap?.collection || {}))
    console.log('📦 block keys:', Object.keys(recordMap?.block || {}))
  }

  const props: PageProps = { site, recordMap, pageId }
  return { ...props, ...(await acl.pageAcl(props)) }
}
