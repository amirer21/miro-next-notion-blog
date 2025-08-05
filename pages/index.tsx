import type { PageProps } from '@/lib/types'
import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { CategorySidebar } from '@/components/CategorySidebar'  // 추가!

//export const getStaticProps = async () => {
export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)

    // 🔍 여기에 로그 추가
    console.log('✅ Notion 데이터 props:', props)
    console.log('🧠 recordMap.collection:', Object.keys(props?.recordMap?.collection || {}))
    console.log('🧠 recordMap.block:', Object.keys(props?.recordMap?.block || {}))

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('❌ page error', domain, err)
    throw err
  }
}


// export default function NotionDomainPage(props: PageProps) {
//   console.log('🧩 NotionPage props:', {
//     pageId: props.pageId,
//     recordMap: props.recordMap,
//     blockCount: Object.keys(props.recordMap?.block || {}).length
//   })

//   return <NotionPage {...props} />
// }
export default function NotionDomainPage(props: PageProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
      {/* 1. 사이드바에 recordMap 등 필요한 데이터 전달 */}
      <CategorySidebar recordMap={props.recordMap} />

      {/* 2. 기존 NotionPage 메인 콘텐츠 */}
      <main style={{ flex: 1 }}>
        <NotionPage {...props} />
      </main>
    </div>
  )
}