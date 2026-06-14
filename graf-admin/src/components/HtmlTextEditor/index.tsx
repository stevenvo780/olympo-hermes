'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { FaCode, FaFont, FaExpand, FaEye } from 'react-icons/fa';
import SafeHtmlRenderer from '../SafeHtmlRenderer';
import styles from './styles.module.scss';
import { ProductContentType } from '@/types';

interface HtmlTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  helpText?: string;
}

export default function HtmlTextEditor({
  value,
  onChange,
  label = 'Contenido',
  placeholder = 'Escribe aquí...',
  helpText,
}: HtmlTextEditorProps) {
  const [showModal, setShowModal] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [mode, setMode] = useState<ProductContentType>(ProductContentType.PLAIN);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLocalValue(value);
    // Auto-detect HTML content
    if (value && (value.includes('<') && value.includes('>'))) {
      setMode(ProductContentType.HTML);
    }
  }, [value]);

  const handleOpen = () => {
    setLocalValue(value);
    setShowModal(true);
  };

  const handleSave = () => {
    onChange(localValue);
    setShowModal(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setShowModal(false);
  };

  const insertHtmlTag = (tag: string, wrap = true) => {
    const textarea = document.getElementById('html-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);

    let newText: string;
    if (wrap && selectedText) {
      newText = localValue.substring(0, start) + `<${tag}>${selectedText}</${tag}>` + localValue.substring(end);
    } else if (tag === 'br') {
      newText = localValue.substring(0, start) + '<br/>' + localValue.substring(end);
    } else if (tag === 'hr') {
      newText = localValue.substring(0, start) + '<hr/>' + localValue.substring(end);
    } else {
      newText = localValue.substring(0, start) + `<${tag}></${tag}>` + localValue.substring(end);
    }

    setLocalValue(newText);
  };

  const previewContent = localValue.trim() || '<em>Sin contenido</em>';

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>{label}</Form.Label>
        <div className={styles.editorPreview}>
          <div className={styles.previewBox} onClick={handleOpen}>
            {value ? (
              <div className={styles.previewContent}>
                {value.length > 150 ? value.substring(0, 150) + '...' : value}
              </div>
            ) : (
              <span className="text-muted">{placeholder}</span>
            )}
          </div>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={handleOpen}
            className={styles.expandButton}
          >
            <FaExpand className="me-1" /> Editar
          </Button>
        </div>
        {helpText && <Form.Text className="text-muted">{helpText}</Form.Text>}
      </Form.Group>

      <Modal show={showModal} onHide={handleCancel} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCode className="me-2" />
            Editor de {label}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Mode Toggle */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <ButtonGroup>
              <ToggleButton
                id="mode-plain"
                type="radio"
                variant={mode === ProductContentType.PLAIN ? 'primary' : 'outline-primary'}
                name="editorMode"
                value={ProductContentType.PLAIN}
                checked={mode === ProductContentType.PLAIN}
                onChange={() => setMode(ProductContentType.PLAIN)}
              >
                <FaFont className="me-1" /> Texto Plano
              </ToggleButton>
              <ToggleButton
                id="mode-html"
                type="radio"
                variant={mode === ProductContentType.HTML ? 'primary' : 'outline-primary'}
                name="editorMode"
                value={ProductContentType.HTML}
                checked={mode === ProductContentType.HTML}
                onChange={() => setMode(ProductContentType.HTML)}
              >
                <FaCode className="me-1" /> HTML
              </ToggleButton>
            </ButtonGroup>

            <Button
              variant={showPreview ? 'secondary' : 'outline-secondary'}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <FaEye className="me-1" /> {showPreview ? 'Ocultar' : 'Vista'} Previa
            </Button>
          </div>

          {/* HTML Toolbar */}
          {mode === ProductContentType.HTML && (
            <div className={styles.toolbar}>
              <ButtonGroup size="sm" className="me-2">
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('h2')}>H2</Button>
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('h3')}>H3</Button>
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('h4')}>H4</Button>
              </ButtonGroup>
              <ButtonGroup size="sm" className="me-2">
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('p')}>P</Button>
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('strong')}>B</Button>
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('em')}>I</Button>
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('u')}>U</Button>
              </ButtonGroup>
              <ButtonGroup size="sm" className="me-2">
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('ul')}>UL</Button>
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('ol')}>OL</Button>
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('li')}>LI</Button>
              </ButtonGroup>
              <ButtonGroup size="sm">
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('br', false)}>BR</Button>
                <Button variant="outline-secondary" onClick={() => insertHtmlTag('hr', false)}>HR</Button>
              </ButtonGroup>
            </div>
          )}

          {/* Editor Area */}
          <div className={showPreview ? styles.splitView : ''}>
            <div className={showPreview ? styles.editorPane : ''}>
              <Form.Control
                id="html-editor-textarea"
                as="textarea"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className={styles.editorTextarea}
                style={{ 
                  minHeight: showPreview ? '400px' : '300px',
                  fontFamily: mode === ProductContentType.HTML ? 'monospace' : 'inherit',
                }}
              />
            </div>

            {/* Preview Pane */}
            {showPreview && (
              <div className={styles.previewPane}>
                <div className={styles.previewLabel}>Vista Previa</div>
                <div className={styles.previewContainer}>
                  {mode === ProductContentType.HTML ? (
                    <SafeHtmlRenderer html={previewContent} />
                  ) : (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{localValue || <em>Sin contenido</em>}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {mode === ProductContentType.HTML && (
            <Form.Text className="text-muted mt-2 d-block">
              Tip: Selecciona texto y haz clic en los botones para envolver con etiquetas HTML.
            </Form.Text>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
