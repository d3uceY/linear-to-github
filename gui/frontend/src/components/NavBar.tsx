import { SERIF } from '../helpers/styles'

export function NavBar() {
  return (
    <header className="h-14 border-b border-[#e6dfd8] bg-[#faf9f5] flex items-center px-8 gap-2.5">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 1v16M1 9h16M3.64 3.64l10.72 10.72M14.36 3.64L3.64 14.36"
          stroke="#141413"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{ fontFamily: SERIF, letterSpacing: '-0.3px' }}
        className="text-[#141413] text-base"
      >
        Linear to GitHub
      </span>
    </header>
  )
}
