import { HookEvent } from '../../../lib/event';
import type { Core } from "@strapi/strapi";
import { UID } from '@strapi/types';
import { utils } from './utils';
import { StrapiDocument } from '../../../lib/document';

export const getStrapiObject = async (
    event: HookEvent,
    populate: any,
    hideFields: string[]
  ): Promise<StrapiDocument | null> => {
  const { model } = event;
  const modelUid = model.uid as UID.ContentType;
  const { getDocumentId, filterProperties } = utils({ strapi });
  const documentId = getDocumentId(event);

  if (!documentId) {
    throw new Error(`No document id found in event.`);
  }

  const strapiObject = await strapi.documents(modelUid).findOne({
    documentId: documentId,
    populate: '*',
    status: 'published',
  });

  return (strapiObject) ? filterProperties(strapiObject, hideFields) as StrapiDocument : null;
};

export const createDocument = async (
  _events: any[],
  populate: any,
  hideFields: string[],
  transformToBooleanFields: string[],
  idPrefix: string,
  collectionName: string
) => {
  // New documents have been created, we index them into Typesense if they are published
  const strapiTypesense = strapi.plugin('strapi-typesense');
  const typesenseService = strapiTypesense.service('typesense');

  const objectsToSave: StrapiDocument[] = [];

  for (const event of _events) {
    const strapiObject = await getStrapiObject(event, populate, hideFields);

    if (strapiObject === null) {
      continue;
    }

    if (strapiObject.publishedAt !== null) {
      objectsToSave.push({
        ...strapiObject,
        'id': idPrefix + strapiObject.documentId,
      });
    }
  }

  await typesenseService.insertDocument(collectionName, objectsToSave);
};

export const deleteDocument = async (
  _event: any,
  idPrefix: string,
  collectionName: string,
) => {
  // A Document has been deleted, we delete it from Typesense
  const strapiTypesense = strapi.plugin('strapi-typesense');
  const typesenseService = strapiTypesense.service('typesense');

  await typesenseService.deleteDocuments(collectionName, [idPrefix + _event.result.documentId]);
};

export const deleteDocuments = async (
  _event: any,
  idPrefix: string,
  collectionName: string,
) => {
  // A Document has been deleted, we delete it from Typesense
  const strapiTypesense = strapi.plugin('strapi-typesense');
  const typesenseService = strapiTypesense.service('typesense');

  const objectIDs = _event.map((event) => {
    return idPrefix + event.result.documentId;
  });

  await typesenseService.deleteDocuments(collectionName, objectIDs);
};
