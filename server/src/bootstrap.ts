import type { Core } from "@strapi/strapi";
import { permissionsActions } from "./permissions-actions";

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  try {
    await strapi.admin?.services.permission.actionProvider.registerMany(
      permissionsActions
    );
  } catch (error) {
    strapi.log.error(
      `'strapi-typesense' permissions bootstrap failed. ${error.message}`
    );
  }

  try {
    await strapi.plugin("strapi-typesense").service("lifecycles").loadLifecycleMethods();
  } catch (error) {
    strapi.log.error(
      `'strapi-typesense' plugin bootstrap lifecycles failed. ${error.message}`
    );
  }

  // We need to make sure our collections are there and the schema is up to date
  try {
    await strapi.plugin("strapi-typesense").service("typesense").createCollections();
  } catch (error) {
    strapi.log.error(
      `'strapi-typesense' plugin bootstrap collections failed. ${error.message}`
    );
  }
};

export default bootstrap;
