import React from 'react'
import Link from 'next/link'
import type { ExtendedRecordMap } from 'notion-types'

type CategorySidebarProps = {
  recordMap: ExtendedRecordMap
}

function extractCategories(recordMap: ExtendedRecordMap) {
  const categories = new Set<string>()
  if (!recordMap?.block) return []

  for (const blockId in recordMap.block) {
    const block = recordMap.block[blockId]?.value
    if (block?.type !== 'page' || !block?.properties) continue

    // 여기서 'Tags' 컬럼만 추출합니다. (대소문자, 띄어쓰기까지 정확히!)
    const tags = block.properties['Tags']
    if (Array.isArray(tags)) {
      tags.forEach((tag) => {
        if (Array.isArray(tag) && tag[0]) {
          categories.add(tag[0])
        }
      })
    }
  }
  return Array.from(categories)
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({ recordMap }) => {
  const categories = extractCategories(recordMap)
  return (
    <aside className="sidebar" style={{ minWidth: 180, paddingRight: 24 }}>
      <h3 style={{ marginBottom: 16 }}>Categories</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {categories.map((category) => (
          <li key={category} style={{ marginBottom: 8 }}>
            <Link href={`/?tag=${encodeURIComponent(category)}`}>{category}</Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
