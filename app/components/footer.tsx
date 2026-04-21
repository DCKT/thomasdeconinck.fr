function TheEndDivider() {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px" style={{ backgroundColor: "#2a1810" }} />
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="6" fill="#c0392b" stroke="#2a1810" strokeWidth="2" />
        <line x1="16" y1="0" x2="16" y2="8" stroke="#2a1810" strokeWidth="1.5" />
        <line x1="16" y1="24" x2="16" y2="32" stroke="#2a1810" strokeWidth="1.5" />
        <line x1="0" y1="16" x2="8" y2="16" stroke="#2a1810" strokeWidth="1.5" />
        <line x1="24" y1="16" x2="32" y2="16" stroke="#2a1810" strokeWidth="1.5" />
        <line x1="4" y1="4" x2="10" y2="10" stroke="#2a1810" strokeWidth="1.5" />
        <line x1="22" y1="22" x2="28" y2="28" stroke="#2a1810" strokeWidth="1.5" />
        <line x1="28" y1="4" x2="22" y2="10" stroke="#2a1810" strokeWidth="1.5" />
        <line x1="10" y1="22" x2="4" y2="28" stroke="#2a1810" strokeWidth="1.5" />
      </svg>
      <div className="flex-1 h-px" style={{ backgroundColor: "#2a1810" }} />
    </div>
  );
}

function toRomanYear(year: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  let n = year;
  for (const [val, sym] of map) {
    while (n >= val) { result += sym; n -= val; }
  }
  return result;
}

function ArrowIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mb-16">
      <TheEndDivider />
      <p
        className="text-center text-lg tracking-[0.3em] mb-6"
        style={{ fontFamily: "var(--font-display)", color: "#2a1810" }}
      >
        — The End —
      </p>
      <ul
        className="font-sm flex flex-col space-y-2 md:flex-row md:space-x-6 md:space-y-0"
        style={{ color: "#2a1810" }}
      >
        <li>
          <a className="flex items-center gap-2 transition-all hover:underline" rel="noopener noreferrer" target="_blank" href="/rss">
            <ArrowIcon /><span>rss</span>
          </a>
        </li>
        <li>
          <a className="flex items-center gap-2 transition-all hover:underline" rel="noopener noreferrer" target="_blank" href="https://github.com/DCKT">
            <ArrowIcon /><span>github</span>
          </a>
        </li>
        <li>
          <a className="flex items-center gap-2 transition-all hover:underline" rel="noopener noreferrer" target="_blank" href="https://x.com/DCK__">
            <ArrowIcon /><span>Twitter</span>
          </a>
        </li>
      </ul>
      <p className="mt-6 text-sm" style={{ color: "#7a6b5a", fontFamily: "var(--font-display)" }}>
        © {toRomanYear(year)} · MIT Licensed · Thomas Deconinck
      </p>
    </footer>
  );
}
