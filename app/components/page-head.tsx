export function PageHead({ jp, title, children }: { jp: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="page-head">
      <p className="eyebrow">{jp}</p>
      <h1>{title}</h1>
      {children && <p className="page-lede">{children}</p>}
    </header>
  );
}
