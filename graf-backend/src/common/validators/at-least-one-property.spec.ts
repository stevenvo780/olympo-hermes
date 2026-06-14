import { validate } from 'class-validator';
import { AtLeastOneProperty } from './at-least-one-property';

class TestDto {
  @AtLeastOneProperty(['email', 'phone'])
  email?: string;

  phone?: string;
}

describe('AtLeastOneProperty', () => {
  it('should fail when no properties are provided', async () => {
    const dto = new TestDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('atLeastOneProperty');
    expect(errors[0].constraints['atLeastOneProperty']).toBe(
      'Debe proporcionar al menos uno de: email, phone',
    );
  });

  it('should pass when first property is provided', async () => {
    const dto = new TestDto();
    dto.email = 'test@example.com';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass when second property is provided', async () => {
    const dto = new TestDto();
    dto.phone = '1234567890';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass when both properties are provided', async () => {
    const dto = new TestDto();
    dto.email = 'test@example.com';
    dto.phone = '1234567890';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail when property is empty string', async () => {
    const dto = new TestDto();
    dto.email = '   ';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should build default message with property names', async () => {
    // The default message is already tested via validation in the first test
    // This verifies that the message format is correct
    const dto = new TestDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints['atLeastOneProperty']).toContain(
      'Debe proporcionar al menos uno de:',
    );
  });

  it('should build default message when validation args are missing', () => {
    let capturedValidator: { defaultMessage: (args?: unknown) => string };

    jest.isolateModules(() => {
      jest.doMock('class-validator', () => ({
        registerDecorator: jest.fn((options) => {
          capturedValidator = options.validator;
        }),
      }));

      const { AtLeastOneProperty } = require('./at-least-one-property');
      const decorator = AtLeastOneProperty(['email', 'phone']);
      decorator({}, 'email');
    });

    expect(capturedValidator.defaultMessage()).toBe(
      'Debe proporcionar al menos uno de: ',
    );

    jest.dontMock('class-validator');
    jest.resetModules();
  });
});
