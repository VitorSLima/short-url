import { nanoid } from 'nanoid';

export const shortenUrl = (): string => {
  return nanoid(6);
};
