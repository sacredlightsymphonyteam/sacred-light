import { useEffect } from 'react'

/**
 * Site-wide reveal-on-scroll. Opt an element in with the global `reveal` class;
 * it will gently rise + fade as it enters the viewport (see global.css).
 *
 * - Adds `html.reveal-on` (arms the hidden state) only when JS + IntersectionObserver
 *   are available, so pre-rendered HTML and no-JS clients show everything.
 * - Elements already in view on load are revealed immediately (no flash).
 * - Elements added after mount (e.g. async content) can be re-scanned by
 *   calling the hook with a dependency, or handled by the component itself.
 */
export function useScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
    const html = document.documentElement
    html.classList.add('reveal-on')

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )

    const vh = window.innerHeight || document.documentElement.clientHeight
    document.querySelectorAll('.reveal').forEach((el) => {
      const r = el.getBoundingClientRect()
      // Already in view → reveal now (no flash); otherwise animate on scroll.
      if (r.top < vh && r.bottom > 0) el.classList.add('in')
      else io.observe(el)
    })

    return () => {
      io.disconnect()
      html.classList.remove('reveal-on')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
