// // test-notion.ts
// import { NotionAPI } from 'notion-client'

// async function main() {
//   const notion = new NotionAPI()
//   const pageId = '23cb7e2e-b40d-80e4-ac6e-f8f4940e3be6'
//   const recordMap = await notion.getPage(pageId)
//   console.log('✅ 성공적으로 로드됨:', Object.keys(recordMap.block || {}).length, 'blocks')
// }

// main().catch(console.error)

// lib/test-notion.mjs

// test-notion.cjs

async function main() {
  const { NotionAPI } = await import('notion-client');
  const { parsePageId } = await import('notion-utils');

  const rawId = '23cb7e2eb40d80e4ac6ef8f4940e3be6';
  const validId = parsePageId(rawId);

  if (!validId) throw new Error('Invalid page ID');

  console.log('✅ pageId parsed:', validId);

  const notion = new NotionAPI();

  console.log('🚀 calling notion.getPage...');
  const recordMap = await notion.getPage(validId);
  console.log('✅ Success:', Object.keys(recordMap.block || {}).length, 'blocks');
}

main().catch((err) => {
  console.error('❌ Error:', err);
});
