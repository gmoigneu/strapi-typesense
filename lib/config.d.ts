export type StrapiTypesenseConfig = {
  server: {
    apiKey: string;
    endpoint: {
      host: string;
      port: number;
      protocol: string;
    };
  };
  contentTypes: {
    name: string;
    index: string;
    prefix?: string;
    populate: any;
    hideFields?: string[];
    transformToBooleanFields?: string[];
    exclude?: string[];
  }[];
};
