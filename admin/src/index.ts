import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import { App } from './pages/App';
import TypeSenseInjectActions from './components/TypeSenseInjectActions';
import { StrapiTypesenseConfig } from '../../lib/config';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: PLUGIN_ID,
      },
      Component: async () => {
        const { App } = await import('./pages/App');

        return App;
      },
    });

    app.createSettingSection(
      {
        id: "typesense",
        intlLabel: {
          id: "typesense.label",
          defaultMessage: "Typesense",
        },
      },
      [
        {
          intlLabel: {
            id: "typesense.settings.label",
            defaultMessage: "Server Settings",
          },
          id: "typesense.settings",
          to: "plugins/typesense/settings",
          Component: App,
          permissions: [],
        },
        {
          intlLabel: {
            id: "typesense.index-settings.label",
            defaultMessage: "Index Settings",
          },
          id: "typesense.index-settings",
          to: "plugins/typesense/index-settings",
          Component: App,
          permissions: [],
        },
      ]
    );

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: true,
      name: PLUGIN_ID,
    });
  },

  bootstrap(app: any) {
    app.getPlugin('content-manager').injectComponent('listView', 'actions', {
      name: 'strapi-typesense-index-all',
      Component: TypeSenseInjectActions,
    });
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTranslations = await Promise.all(
      (locales as string[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: getTranslation(data),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return importedTranslations;
  },
};
