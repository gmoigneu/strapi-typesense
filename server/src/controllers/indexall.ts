import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  indexAll(ctx) {
    strapi.plugin('strapi-typesense').service('typesense').indexAll({
      collectionName: ctx.request.body.contentType
    });
  },
});

export default controller;
