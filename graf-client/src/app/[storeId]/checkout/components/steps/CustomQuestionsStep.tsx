'use client';
import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { CustomQuestion } from '@/types';
import { FaPencilAlt } from 'react-icons/fa';

interface CustomQuestionsStepProps {
  answers: { question: string; answer: string }[];
  onChange: (answers: { question: string; answer: string }[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const CustomQuestionsStep: React.FC<CustomQuestionsStepProps> = ({
  answers, onChange, onNext, onBack,
}) => {
  const config = useSelector((state: RootState) => state.ui.store?.configuration);
  const questions: CustomQuestion[] = config?.customQuestions || [];

  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    questions.forEach(q => {
      const existing = answers.find(a => a.question === q.question);
      initial[q.question] = existing?.answer || '';
    });
    setLocalAnswers(initial);
  }, [questions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (question: string, value: string) => {
    setLocalAnswers(prev => ({ ...prev, [question]: value }));
  };

  const allRequiredAnswered = questions.every(
    q => q.required === false || (localAnswers[q.question]?.trim() ?? '') !== ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = questions
      .map(q => ({ question: q.question, answer: localAnswers[q.question]?.trim() || '' }))
      .filter(a => a.answer !== '');
    onChange(formatted);
    onNext();
  };

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-card__title"><FaPencilAlt className="me-2" />Información Adicional</div>
      <p className="wizard-step-card__subtitle">
        Por favor, responde las siguientes preguntas sobre tu pedido.
      </p>

      <Form onSubmit={handleSubmit}>
        {questions.map((q, i) => (
          <Form.Group key={i} className="mb-3">
            <Form.Label>
              {q.question} {q.required !== false && <span className="text-danger">*</span>}
            </Form.Label>

            {q.type === 'textarea' ? (
              <Form.Control as="textarea" rows={3}
                value={localAnswers[q.question] || ''}
                onChange={e => handleChange(q.question, e.target.value)}
                required={q.required !== false} />
            ) : q.type === 'select' && q.options?.length ? (
              <Form.Select
                value={localAnswers[q.question] || ''}
                onChange={e => handleChange(q.question, e.target.value)}
                required={q.required !== false}>
                <option value="">Selecciona una opción</option>
                {q.options.map((opt, j) => (
                  <option key={j} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            ) : q.type === 'deliveryZone' ? (
              <Form.Select
                value={localAnswers[q.question] || ''}
                onChange={e => handleChange(q.question, e.target.value)}
                required={q.required !== false}>
                <option value="">Seleccione una zona</option>
                {q.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            ) : (
              <Form.Control type="text"
                value={localAnswers[q.question] || ''}
                onChange={e => handleChange(q.question, e.target.value)}
                required={q.required !== false} />
            )}
          </Form.Group>
        ))}

        <div className="wizard-nav">
          <Button variant="outline-secondary" onClick={onBack} className="wizard-nav__btn">
            ← Atrás
          </Button>
          <Button variant="primary" type="submit" disabled={!allRequiredAnswered} className="wizard-nav__btn">
            Continuar →
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CustomQuestionsStep;
