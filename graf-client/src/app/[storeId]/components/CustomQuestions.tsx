'use client';
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { CustomQuestion } from '@/types';

interface CustomQuestionsProps {
  show: boolean;
  onHide: () => void;
  questions: CustomQuestion[];
  onSubmit: (answers: { question: string; answer: string }[]) => void;
  isSubmitting: boolean;
  title?: string;
}

const CustomQuestions: React.FC<CustomQuestionsProps> = ({ 
  show, 
  onHide, 
  questions, 
  onSubmit,
  isSubmitting,
  title = 'Información Adicional'
}) => {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (show) {
      const initialAnswers: { [key: string]: string } = {};
      questions.forEach(q => {
        initialAnswers[q.question] = '';
      });
      setAnswers(initialAnswers);
    }
  }, [questions, show]);

  const handleChange = (question: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedAnswers = questions.map(question => {
      const answer = answers[question.question]?.trim() || '';
      const isRequired = question.required !== false;
      
      if (isRequired && !answer) {
      }
      
      return {
        question: question.question,
        answer
      };
    }).filter(a => a.answer !== '');
    
    onSubmit(formattedAnswers);
  };

  const allQuestionsAnswered = questions.every(q => 
    (q.required === false) || answers[q.question]?.trim()
  );

  const handleClose = () => {
    setAnswers({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static" style={{ zIndex: 2100 }}>
      <Modal.Header closeButton={!isSubmitting}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <p>Por favor, responde las siguientes preguntas:</p>
          {questions.map((q, index) => (
            <div key={index}>
              {q.type === 'deliveryZone' ? (
                <>
                  <Form.Label>{q.question}{q.required !== false && ' *'}</Form.Label>
                  <Form.Select
                    value={answers[q.question] || ''}
                    onChange={e => handleChange(q.question, e.target.value)}
                    required={q.required !== false}
                  >
                    <option value="">Seleccione una zona</option>
                    {q.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>
                    {q.question} {q.required !== false && <span className="text-danger">*</span>}
                  </Form.Label>
                  
                  {q.type === 'textarea' ? (
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={answers[q.question] || ''}
                      onChange={(e) => handleChange(q.question, e.target.value)}
                      required={q.required !== false}
                    />
                  ) : q.type === 'select' && q.options?.length ? (
                    <Form.Select
                      value={answers[q.question] || ''}
                      onChange={(e) => handleChange(q.question, e.target.value)}
                      required={q.required !== false}
                    >
                      <option value="">Selecciona una opción</option>
                      {q.options.map((opt, i) => (
                        <option key={i} value={opt.value}>{opt.label}</option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type="text"
                      value={answers[q.question] || ''}
                      onChange={(e) => handleChange(q.question, e.target.value)}
                      required={q.required !== false}
                    />
                  )}
                </Form.Group>
              )}
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={!allQuestionsAnswered || isSubmitting}>
            {isSubmitting ? <Spinner animation="border" size="sm" /> : 'Continuar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CustomQuestions;
