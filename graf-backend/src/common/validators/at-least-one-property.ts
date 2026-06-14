import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function AtLeastOneProperty(
  properties: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneProperty',
      target: object.constructor,
      propertyName: propertyName,
      constraints: properties,
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const props = args.constraints as string[];
          return props.some((prop) => {
            const value = (args.object as Record<string, unknown>)[prop];
            return (
              value !== undefined &&
              value !== null &&
              String(value).trim() !== ''
            );
          });
        },
        defaultMessage(args?: ValidationArguments) {
          const props = (args?.constraints as string[]) || [];
          return `Debe proporcionar al menos uno de: ${props.join(', ')}`;
        },
      },
    });
  };
}
