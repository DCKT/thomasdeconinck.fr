import "../styles/HtmlContent.module.css";

export type HtmlContentProps = {
  content: string;
};

export default function HtmlContent({ content }: HtmlContentProps) {
  return (
    <main
      className="html mt-8 line-numbers"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
