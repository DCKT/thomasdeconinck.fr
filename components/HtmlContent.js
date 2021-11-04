import "../styles/HtmlContent.module.css";

export default function ({ content }) {
  return (
    <main
      className="html mt-8 line-numbers"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
