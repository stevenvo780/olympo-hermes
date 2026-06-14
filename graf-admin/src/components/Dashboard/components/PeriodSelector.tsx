import React, { useState, useEffect, useCallback } from 'react';
import { ButtonGroup, ToggleButton, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface PeriodSelectorProps {
  period: 'day' | 'week' | 'month' | 'custom';
  onChangePeriod: (period: 'day' | 'week' | 'month' | 'custom') => void;
  startDate: string | null;
  endDate: string | null;
  onChangeDateRange: (startDate: string | null, endDate: string | null) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  period,
  onChangePeriod,
  startDate,
  endDate,
  onChangeDateRange,
}) => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    startDate ? new Date(startDate) : null,
    endDate ? new Date(endDate) : null
  ]);
  
  const setDefaultDateRange = useCallback(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setDateRange([start, end]);
    
    const formattedStart = start.toISOString().split('T')[0];
    const formattedEnd = end.toISOString().split('T')[0];
    onChangeDateRange(formattedStart, formattedEnd);
  }, [onChangeDateRange]);
  
  const [startDatePickerValue, endDatePickerValue] = dateRange;

  const periods = [
    { name: 'Diario', value: 'day' },
    { name: 'Semanal', value: 'week' },
    { name: 'Mensual', value: 'month' },
    { name: 'Personalizado', value: 'custom' },
  ];

  useEffect(() => {
    if (period !== 'custom') {
      setDateRange([null, null]);
      onChangeDateRange(null, null);
      return;
    }

    if (!startDatePickerValue && !endDatePickerValue) {
      setDefaultDateRange();
    }
  }, [
    period,
    startDatePickerValue,
    endDatePickerValue,
    onChangeDateRange,
    setDefaultDateRange,
  ]);

  const handleDateChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
    
    if (update[0] && update[1]) {
      const formattedStart = update[0].toISOString().split('T')[0];
      const formattedEnd = update[1].toISOString().split('T')[0];
      onChangeDateRange(formattedStart, formattedEnd);
    } else if (!update[0] && !update[1]) {
      setDefaultDateRange();
    }
  };

  const handlePeriodChange = (value: string) => {
    const newPeriod = value as 'day' | 'week' | 'month' | 'custom';
    onChangePeriod(newPeriod);
    
    if (newPeriod === 'custom' && (!startDatePickerValue && !endDatePickerValue)) {
      setDefaultDateRange();
    }
  };

  return (
    <div>
      <ButtonGroup className="mb-3">
        {periods.map((option) => (
          <ToggleButton
            key={option.value}
            id={`period-${option.value}`}
            type="radio"
            variant="outline-primary"
            name="period"
            value={option.value}
            checked={period === option.value}
            onChange={(e) => handlePeriodChange(e.currentTarget.value)}
          >
            {option.name}
          </ToggleButton>
        ))}
      </ButtonGroup>
      
      {period === 'custom' && (
        <Row className="align-items-center">
          <Col>
            <DatePicker
              selectsRange={true}
              startDate={startDatePickerValue}
              endDate={endDatePickerValue}
              onChange={handleDateChange}
              className="form-control"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar rango de fechas"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              isClearable={false}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default PeriodSelector;
