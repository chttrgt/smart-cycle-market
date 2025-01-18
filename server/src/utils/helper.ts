import { Response } from "express";

export const sendErrorRes = (
  res: Response,
  message: string,
  statusCode: number
) => {
  res.status(statusCode).json({ message });
};

export function getEnvVariablesWithDefaults(
  variables: { name: string; defaultValue?: string }[]
): { [key: string]: string } {
  const envVariables: { [key: string]: string } = {};

  for (const { name, defaultValue } of variables) {
    const value = process.env[name] || defaultValue;
    if (!value) {
      throw new Error(
        `Environment variable ${name} is not defined and no default value is provided.`
      );
    }
    envVariables[name] = value;
  }

  return envVariables;
}
