# strapi-typesense

Index your content into a Typesense server that you can then query with modules like [InstantSearch](https://github.com/algolia/instantsearch).

## Installation

```
yarn add strapi-typesense
```

## Configuration

Add the plugin configuration to your `plugins.ts` configuration file like the following example:

```
"strapi-typesense": {
    config: {
      server: {
        apiKey: "<YOUR TYPESENSE KEY>",
        endpoint: {
          host: "localhost",
          port: 8108,
          protocol: "http",
        },
      },
      contentTypes: [
        {
          name: "api::artist.artist",
          exclude: ["createdBy", "updatedBy"],
        },
        { name: "api::event.event" },
      ],
    },
  },
```

You need to list the contentTypes that your project needs to index into Typesense with their Strapi naming convention: `api::<type>.<type>`.

## Usage

The plugin creates the collections in Typesense on startup.
Whenever you create, update or delete a published documents, the plugin updates Typesense with the corresponding objects.



