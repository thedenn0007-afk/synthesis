export function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-[13px] font-semibold text-[#e8e8f0] mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-[15px] font-semibold text-[#e8e8f0] mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-[17px] font-semibold text-[#e8e8f0] mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e8e8f0]">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-[#17171f] border border-white/[0.06] rounded px-1.5 py-0.5 text-[11px] text-[#60a5fa] font-mono">$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-[#0e0e16] border border-white/[0.06] rounded-lg p-4 text-[12px] text-[#9898b0] font-mono leading-[1.7] overflow-x-auto my-4">$1</pre>')
    .replace(/\n\n/g, '</p><p class="text-[13px] text-[#9898b0] leading-[1.7] my-2">')
    .replace(/^(?!<[h|p|pre|ul|ol|li])/gm, '')
    .replace(/^- (.+)$/gm, '<li class="text-[13px] text-[#9898b0] leading-[1.6] ml-4 list-disc">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="my-3 space-y-1">$&</ul>')
}
