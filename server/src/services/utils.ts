import type { Core } from "@strapi/strapi";
import { HookEvent } from '../../../lib/event';
import { StrapiDocument } from '../../../lib/document';

export const utils = ({ strapi }: { strapi: Core.Strapi }) => ({
  filterProperties: (
    object: Record<string, any>,
    hiddenFields: string[]
  ) =>
    Object.keys(object).reduce((acc, key) => {
      if (hiddenFields.includes(key)) {
        return acc;
      }

      return { ...acc, [key]: object[key] } as StrapiDocument;
    }, {}),
  getDocumentId: (event: HookEvent) =>
    event?.result?.documentId ?? event?.params?.where?.documentId,
  getChunksRequests: (array: any[], chunkSize = 600) => {
    if (chunkSize <= 0) {
      throw new Error('chunkSize must be greater than 0');
    }

    const chunks: any[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  },
});
