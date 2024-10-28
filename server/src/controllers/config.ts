import type { Core } from '@strapi/strapi';
import Koa from 'koa';
import { StrapiTypesenseConfig } from '../../../lib/config';

const config = ({ strapi }: { strapi: Core.Strapi }) => ({
  async index(
    ctx: Koa.Context & {
      request: {
        body?: unknown;
        rawBody: string;
      };
    }
  ) {
    const { contentTypes } = strapi.config.get(
      'plugin::strapi-typesense'
    ) as StrapiTypesenseConfig;

    if (!contentTypes) {
      return;
    }

    ctx.body = {
      contentTypes: contentTypes.map(
        (contentType) => contentType.name
      ),
    };
  },
});

export default config;
