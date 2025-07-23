import { nanoid } from 'nanoid';

/**
 * Shorten a URL
 * @returns The shortened URL
 */
export const shortenUrl = (): string => {
  return nanoid(6);
};
