import type { Core } from "@strapi/strapi";
import type { StrapiTypesenseConfig } from "../../../lib/config";
import { createDocument, deleteDocument, deleteDocuments } from "./strapi";

const lifecycles = ({ strapi }: { strapi: Core.Strapi }) => ({
  async loadLifecycleMethods() {
    const {
      contentTypes,
    } = strapi.config.get(
      "plugin::strapi-typesense"
    ) as StrapiTypesenseConfig;

    strapi.log.info('Loading lifecycle methods');

    // If no content types are configured, do nothing
    if (!contentTypes) {
      return;
    }

    // Subscribe to the afterCreate, afterUpdate, afterDelete, and afterDeleteMany events for each content type
    for (const contentType of contentTypes) {
      const {
        name,
        index,
        prefix = '',
        populate = '*',
        hideFields = [],
        transformToBooleanFields = [],
      } = contentType;

      if (strapi.contentTypes[name]) {
        // Infer the index name
        const collectionName = `${prefix}${index ?? name}`;

        strapi.log.info(`Subscribing to lifecycle events for the ${name} content type`);

        // Subscribe to the afterCreate, afterUpdate, afterDelete, and afterDeleteMany events
        strapi.db?.lifecycles.subscribe({
          models: [name],
          // afterCreate: async (event) => {
          //   await createDocument(
          //     [event],
          //     populate,
          //     hideFields,
          //     transformToBooleanFields,
          //     prefix,
          //     collectionName
          //   );
          // },
          afterDelete: async (event) => {
            await deleteDocument(
              event,
              prefix,
              collectionName,
            );
          },
          afterDeleteMany: async (event) => {
            await deleteDocuments(
              event,
              prefix,
              collectionName,
            );
          },
        });
      }
    }
  },
});

export default lifecycles;
