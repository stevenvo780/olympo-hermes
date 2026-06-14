import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
}

const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({ html, className, style }) => {

  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'div', 'span',
      'strong', 'b', 'em', 'i', 'u',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'style'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    ADD_URI_SAFE_ATTR: ['href'],
  });

  return (
    <div
      className={`safe-html-content ${className || ''}`}
      style={{ lineHeight: '1.6', ...style }}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default SafeHtmlRenderer;
