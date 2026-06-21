import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

type SafeHtmlRendererProps = {
  html: string;
  className?: string;
};

const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({ html, className }) => {
  const cleanHtml = DOMPurify.sanitize(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default SafeHtmlRenderer;
