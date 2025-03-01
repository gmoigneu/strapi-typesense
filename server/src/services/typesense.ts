import type { Core } from "@strapi/strapi";
import type { StrapiTypesenseConfig } from "../../../lib/config";
import Typesense from 'typesense';
import { StrapiDocument } from "../../../lib/document";

export const getTypesenseClient = async () => {
  const {
    server: { apiKey, endpoint },
  } = strapi.config.get(
    "plugin::strapi-typesense"
  ) as StrapiTypesenseConfig;

  const client = new Typesense.Client({
    nodes: [
      {
        host: endpoint.host,
        port: endpoint.port,
        protocol: endpoint.protocol,
      },
    ],
    apiKey: apiKey,
  });
  return client;
};

export const getContentTypes = async () => {
  const {
      contentTypes: contentTypes,
    } = strapi.config.get(
      "plugin::strapi-typesense"
    ) as StrapiTypesenseConfig;

  return contentTypes;
};

export async function checkCollections() {
  const client = await getTypesenseClient();
  const collections = await client.collections().retrieve();

  try {
    const contentTypes = await getContentTypes();
    contentTypes.forEach(contentType => {
      if (!collections.some(collection => collection.name === contentType.name)) {
        client.collections().create({
          "name": contentType.name,
          "fields": [
            {"name": ".*", "type": "auto" }
          ]
        });
        strapi.log.info(`Collection ${contentType.name} created`);
      } else {
        strapi.log.info(`Collection ${contentType.name} already exists`);
      }
    });
  } catch (error) {
    strapi.log.error(`Failed to check or create collections: ${error}`);
  }
}

export const getDocument = async (collectionName: string, documentId: string) => {
  const client = await getTypesenseClient();

  const document = await client.collections(collectionName).documents(documentId).retrieve();
  return document;
};

function deletePropertyPath(obj, path) {
  if (!obj || !path) {
    return;
  }

  if (typeof path === "string") {
    path = path.split(".");
  }

  for (var i = 0; i < path.length - 1; i++) {
    obj = obj[path[i]];

    if (typeof obj === "undefined") {
      return;
    }
  }

  delete obj[path.pop()];
}

function dateToTimestamp(object) {
  const isoDateRegex =
    /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/;

  for (const property in object) {
    if (typeof object[property] === "object") {
      object[property] = dateToTimestamp(object[property]);
    } else if (isoDateRegex.test(object[property])) {
      object[property] = Math.floor(
        new Date(object[property]).getTime() / 1000,
      );
    } else {
      object[property] = object[property];
    }
  }

  return object;
}

const prepareDocuments = (documents, type) => {
  const contentType = strapi.contentTypes[type.name];

  documents = documents.map((document) => {
    for (const field of type.exclude) {
      deletePropertyPath(document, field);
    }
    return document;
  });

  // Convert dates to unix timestamps
  documents = documents.map((document) => {
    return dateToTimestamp(document);
  });

  // Add id field
  documents = documents.map((document) => {
    document.id = document.documentId;
    return document;
  });

  return documents;
};

const typesense = ({ strapi: strapi2 }) => ({
  insertDocument: async (collectionName, documents) => {
    const client = await getTypesenseClient();
    const config2 = strapi2.config.get("plugin::strapi-typesense");
    const type = config2.contentTypes.find((ct) => ct.name === collectionName);
    documents = prepareDocuments(documents, type);
    documents.forEach((document) => {
      client
        .collections(collectionName)
        .documents()
        .create(document)
        .then((response) => {
          strapi2.log.info(`Document ${document.documentId} inserted.`);
        })
        .catch((error) => {
          strapi2.log.error(
            `Error inserting document ${JSON.stringify(document)}: ${error}`,
          );
        });
    });
  },
  deleteDocuments: async (collectionName, documents) => {
    const client = await getTypesenseClient();
    documents.forEach((document) => {
      client
        .collections(collectionName)
        .documents(document)
        .delete()
        .then((response) => {
          strapi2.log.info(`Document ${document} deleted.`);
        })
        .catch((error) => {
          strapi2.log.error(
            `Error deleting document ${JSON.stringify(document)}: ${error}`,
          );
        });
    });
  },
  indexAll: async ({ collectionName }) => {
    const client = await getTypesenseClient();
    strapi2.log.info(`Indexing all documents for ${collectionName}.`);
    client
      .collections(collectionName)
      .documents()
      .delete({ filter_by: "id:!=0" })
      .then((response) => {
        strapi2.log.info(`Truncate ${collectionName}.`);
        const contentType = strapi2.contentTypes[collectionName];
        strapi2.entityService
          .findMany(contentType.uid, {
            populate: "*",
            status: "published",
          })
          .then((documents) => {
            if (documents.length > 0) {
              const config2 = strapi2.config.get("plugin::strapi-typesense");
              const type = config2.contentTypes.find(
                (ct) => ct.name === collectionName,
              );
              documents = prepareDocuments(documents, type);

              client
                .collections(collectionName)
                .documents()
                .import(documents)
                .then((response2) => {
                  strapi2.log.info(`${documents.length} documents indexed.`);
                })
                .catch((error) => {
                  strapi2.log.error(`Error indexing documents: ${error}`);
                  error.importResults.forEach((error2) => {
                    strapi2.log.error(
                      `Error indexing document ${error2.documentId}: ${error2.error}`,
                    );
                  });
                });
            } else {
              strapi2.log.info(`No documents to index.`);
            }
          });
      })
      .catch((error) => {
        strapi2.log.error(
          `Error deleting collection ${collectionName}: ${error}`,
        );
      });
  },
  createCollections: async () => {
    checkCollections();
  },
});

export default typesense;
