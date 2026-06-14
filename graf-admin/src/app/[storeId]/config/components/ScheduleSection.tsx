import React, { useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { Config, ScheduleDay } from '@/types';

type ConfigWithBanners = Config & { banners: string[] };

type ScheduleSectionProps = {
  schedule: ScheduleDay[];
  daysOfWeek: { id: string; label: string }[];
  formData: ConfigWithBanners;
  setFormData: React.Dispatch<React.SetStateAction<ConfigWithBanners | null>>;
};

const ScheduleSection: React.FC<ScheduleSectionProps> = ({ daysOfWeek, formData, setFormData, schedule }) => {
  const currentSchedule = schedule || [];

  useEffect(() => {
    if (!formData.schedule || formData.schedule.length === 0) {
      const initialSchedule = daysOfWeek.map(day => ({
        day: day.id,
        isOpen: true,
        openTime: '08:00',
        closeTime: '18:00'
      }));
      setFormData(prev => prev ? {
        ...prev,
        schedule: initialSchedule,
      } : prev);
    }
  }, [daysOfWeek, formData, setFormData]);

  const generateTimeOptions = () => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMin = min.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMin}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleScheduleChange = (dayId: string, field: keyof ScheduleDay, value: boolean | string) => {
    setFormData(prev => {
      if (!prev) return prev;
      const updatedSchedule = [...(prev.schedule || [])];
      const dayIndex = updatedSchedule.findIndex(day => day.day === dayId);
      if (dayIndex !== -1) {
        const updatedDay = {
          ...updatedSchedule[dayIndex],
          [field]: value
        };
        updatedSchedule[dayIndex] = updatedDay;
      } else {
        updatedSchedule.push({
          day: dayId,
          isOpen: field === 'isOpen' ? value as boolean : false,
          openTime: field === 'openTime' ? value as string : '08:00',
          closeTime: field === 'closeTime' ? value as string : '18:00'
        });
      }
      return {
        ...prev,
        schedule: updatedSchedule
      };
    });
  };

  return (
    <fieldset className="mb-4">
      <legend>Horarios de Atención</legend>

      <Row className="mb-3 fw-bold">
        <Col md={4}></Col>
        <Col md={4} className="text-center">Hora de apertura</Col>
        <Col md={4} className="text-center">Hora de cierre</Col>
      </Row>
      
      {daysOfWeek.map(day => {
        const daySchedule = currentSchedule.find(s => s.day === day.id) || {
          day: day.id,
          isOpen: true,
          openTime: '08:00',
          closeTime: '18:00'
        };
        return (
          <Row key={day.id} className="mb-3 align-items-center">
            <Col md={4}>
              <Form.Check
                type="switch"
                id={`schedule-${day.id}`}
                label={day.label}
                checked={daySchedule.isOpen}
                onChange={e => handleScheduleChange(day.id, 'isOpen', e.target.checked)}
                className="fs-5"
              />
            </Col>
            <Col md={4}>
              <Form.Select
                disabled={!daySchedule.isOpen}
                value={daySchedule.openTime || '08:00'}
                onChange={e => handleScheduleChange(day.id, 'openTime', e.target.value)}
              >
                {timeOptions.map(time => (
                  <option key={`open-${day.id}-${time}`} value={time}>{time}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select
                disabled={!daySchedule.isOpen}
                value={daySchedule.closeTime || '18:00'}
                onChange={e => handleScheduleChange(day.id, 'closeTime', e.target.value)}
              >
                {timeOptions.map(time => (
                  <option key={`close-${day.id}-${time}`} value={time}>{time}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        );
      })}
    </fieldset>
  );
};

export default ScheduleSection;