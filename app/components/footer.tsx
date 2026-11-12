const LINKS = [
  { href: "/rss", label: "RSS" },
  { href: "https://github.com/DCKT", label: "GitHub" },
  { href: "https://x.com/DCK__", label: "Twitter" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="receipt">
        <p className="receipt-title">ありがとうございました</p>
        <p className="receipt-sub">Thank you, come again</p>
        <ul>
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                <span>{label}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="barcode" aria-hidden="true" />
        <p className="receipt-meta">© {new Date().getFullYear()} Thomas Deconinck · MIT · Open 24/7</p>
      </div>
    </footer>
  );
}
