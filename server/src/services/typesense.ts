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

const typesense = ({ strapi }: { strapi: Core.Strapi }) => ({
  insertDocument: async (collectionName: string, documents: StrapiDocument[] ) => {
    const client = await getTypesenseClient();

    const config = strapi.config.get('plugin::strapi-typesense') as StrapiTypesenseConfig;
    const excludeFields = config.contentTypes.find(ct => ct.name === collectionName)?.exclude || [];

    documents = documents.map(document => {
      excludeFields.forEach(field => {
        delete document[field];
      });
      document.id = document.documentId;
      return document;
    });

    documents.forEach(document => {
      client.collections(collectionName).documents().create(document).then(response => {
        strapi.log.info(`Document ${document.documentId} inserted.`);
    }).catch(error => {
      strapi.log.error(`Error inserting document ${JSON.stringify(document)}: ${error}`);
    });
    });
  },
  deleteDocuments: async (collectionName: string, documents: string[]) => {
    const client = await getTypesenseClient();

    documents.forEach(document => {
      client.collections(collectionName).documents(document).delete().then(response => {
        strapi.log.info(`Document ${document} deleted.`);
      }).catch(error => {
        strapi.log.error(`Error deleting document ${JSON.stringify(document)}: ${error}`);
      });
    });
  },
  indexAll: async ({ collectionName }: { collectionName: string }) => {
    const client = await getTypesenseClient();
    strapi.log.info(`Indexing all documents for ${collectionName}.`);

    client.collections(collectionName).documents().delete({'filter_by': 'id:!=0'}).then(response => {
      strapi.log.info(`Truncate ${collectionName}.`);
      const contentType = strapi.contentTypes[collectionName];
      strapi.entityService.findMany(contentType.uid, {
        populate: "*",
        status: 'published'
      }).then(documents => {
        if (documents.length > 0) {

          const config = strapi.config.get('plugin::strapi-typesense') as StrapiTypesenseConfig;
          const excludeFields = config.contentTypes.find(ct => ct.name === collectionName)?.exclude || [];

          // Remove excluded fields from the documents
          documents = documents.map(doc => {
            excludeFields.forEach(field => {
              delete doc[field];
            });
            return doc;
          });

          // Import the documents
          client.collections(collectionName).documents().import(documents.map(document => ({
            ...document, id: document.documentId
          })), {action: 'create'}).then(response => {
            strapi.log.info(`${documents.length} documents indexed.`);
          }).catch(error => {
              strapi.log.error(`Error indexing documents: ${error}`);
              error.importResults.forEach(error => {
                strapi.log.error(`Error indexing document ${error.documentId}: ${error.error}`);
              });
            });
        } else {
          strapi.log.info(`No documents to index.`);
        }
      });
    }).catch(error => {
      strapi.log.error(`Error deleting collection ${collectionName}: ${error}`);
    });
  },
  createCollections: async () => {
    checkCollections()
  }
});

export default typesense;
