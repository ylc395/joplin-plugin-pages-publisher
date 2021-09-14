import { ValidateFunction } from 'ajv';

export const getValidator = (validator: ValidateFunction, errorName: string) => {
  return (data: unknown) => {
    if (!validator(data)) {
      const errMsg = validator.errors
        ?.map(({ message, instancePath }) => `${instancePath}: ${message}`)
        .join(`\n${' '.repeat(4)}`);
      throw new Error(`${errorName}: \n${' '.repeat(4)}${errMsg}`);
    }
  };
};
