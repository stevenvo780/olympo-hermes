import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import Select from 'react-select';
import { CustomQuestion } from '@/types';

const questionTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Selección' }
];

interface SelectOption {
  value: string;
  label: string;
}

interface CustomQuestionFormProps {
  questions: CustomQuestion[];
  onChange: (questions: CustomQuestion[]) => void;
}

const CustomQuestionForm: React.FC<CustomQuestionFormProps> = ({ questions, onChange }) => {
  const [newOption, setNewOption] = useState<string>('');
  
  const handleQuestionChange = (index: number, value: string) => {
    const updatedQuestions = questions.map((q, i) => {
      if (i === index) return { ...q, question: value };
      return q;
    });
    onChange(updatedQuestions);
  };
  
  const handleTypeChange = (index: number, selectedOption: SelectOption | null) => {
    if (!selectedOption) return;
    const updatedQuestions = questions.map((q, i) => {
      if (i === index) {
        const newQuestion = { ...q, type: selectedOption.value };
        if (selectedOption.value === 'select' && !newQuestion.options) {
          newQuestion.options = [];
        } else if (selectedOption.value !== 'select') {
          return { ...newQuestion, options: undefined };
        }
        return newQuestion;
      }
      return q;
    });
    onChange(updatedQuestions);
  };
  
  const handleRequiredChange = (index: number, isRequired: boolean) => {
    const updatedQuestions = questions.map((q, i) => {
      if (i === index) return { ...q, required: isRequired };
      return q;
    });
    onChange(updatedQuestions);
  };
  
  const handleAddOption = (index: number) => {
    if (!newOption.trim()) return;
    const updatedQuestions = questions.map((q, i) => {
      if (i === index) {
        const currentOptions = q.options || [];
        return { ...q, options: [...currentOptions, { value: newOption, label: newOption }] };
      }
      return q;
    });
    onChange(updatedQuestions);
    setNewOption('');
  };
  
  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = questions.map((q, i) => {
      if (i === questionIndex && q.options) {
        return { ...q, options: q.options.filter((_, j) => j !== optionIndex) };
      }
      return q;
    });
    onChange(updatedQuestions);
  };
  
  const handleAddQuestion = () => {
    onChange([...questions, { question: '', type: 'text', required: false }]);
  };
  
  const handleRemoveQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div>
      {questions.map((question, index) => (
        <div key={index} className="mb-4 border p-3 rounded">
          <div className="d-flex justify-content-end mb-2">
            <Button variant="outline-danger" size="sm" type="button" onClick={() => handleRemoveQuestion(index)}>
              × Eliminar pregunta
            </Button>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Pregunta</Form.Label>
            <Form.Control
              type="text"
              value={question.question}
              onChange={e => handleQuestionChange(index, e.target.value)}
              placeholder="Escribe la pregunta aquí"
            />
          </Form.Group>
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Respuesta</Form.Label>
                <Select
                  options={questionTypes}
                  value={questionTypes.find(type => type.value === question.type)}
                  onChange={option => handleTypeChange(index, option)}
                  placeholder="Selecciona un tipo"
                  classNamePrefix="select"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3 mt-4">
                <Form.Check 
                  type="checkbox"
                  id={`required-${index}`}
                  label="Obligatoria"
                  checked={question.required || false}
                  onChange={e => handleRequiredChange(index, e.target.checked)}
                />
              </Form.Group>
            </Col>
          </Row>
          {question.type === 'select' && (
            <div className="mt-3">
              <Form.Label>Opciones de Respuesta</Form.Label>
              {(question.options || []).map((option, optionIndex) => (
                <div key={optionIndex} className="d-flex mb-2">
                  <Form.Control type="text" readOnly value={option.label} className="me-2" />
                  <Button variant="outline-danger" size="sm" type="button" onClick={() => handleRemoveOption(index, optionIndex)}>
                    ×
                  </Button>
                </div>
              ))}
              <Row className="mt-2">
                <Col>
                  <Form.Control
                    type="text"
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    placeholder="Nueva opción"
                  />
                </Col>
                <Col xs="auto">
                  <Button variant="secondary" size="sm" type="button" onClick={() => handleAddOption(index)}>
                    Agregar Opción
                  </Button>
                </Col>
              </Row>
            </div>
          )}
        </div>
      ))}
      <Button variant="secondary" type="button" onClick={handleAddQuestion}>
        Agregar Nueva Pregunta
      </Button>
    </div>
  );
};

export default CustomQuestionForm;
