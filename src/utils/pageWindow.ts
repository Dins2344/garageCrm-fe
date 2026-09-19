/**
 * The page numbers to show: always the first and last, the current page with
 * two neighbours either side, and a gap marker wherever pages are skipped.
 * 203 pages used to render 203 buttons.
 */
export const pageWindow = (page: number, pages: number): (number | 'gap')[] => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  let lo = Math.max(2, Math.min(page - 2, pages - 5));
  let hi = Math.min(pages - 1, Math.max(page + 2, 6));
  // A gap standing in for exactly one page is sillier than the page itself.
  if (lo === 3) lo = 2;
  if (hi === pages - 2) hi = pages - 1;
  const out: (number | 'gap')[] = [1];
  if (lo > 2) out.push('gap');
  for (let n = lo; n <= hi; n++) out.push(n);
  if (hi < pages - 1) out.push('gap');
  out.push(pages);
  return out;
};
