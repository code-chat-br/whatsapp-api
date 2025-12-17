import { isBase64 } from 'class-validator';

type BufferLike = Buffer | { type: 'Buffer'; data: number[] } | undefined | null;

// eslint-disable-next-line prettier/prettier
export const toBase64 = (value: { type: 'Buffer'; data: number[] } | BufferLike): any | null => {
  if (!value) return null;

  if (isBase64(value)) {
    return value;
  }

  if (isBase64(value?.['data'])) {
    return value['data'];
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  if (typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
    return Buffer.from(value.data).toString('base64');
  }

  console.error(Error('Formato de buffer desconhecido'));
  return null;
};
