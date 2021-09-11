import type { AnalyticsPlugin, AnalyticsInstance } from 'analytics';

type Payload = { [key: string]: any };
type History = { type: string; payload: Payload }[];

const INTERACTION_EVENT_TYPES = ['scroll', 'mousemove', 'touchstart', 'keydown'];

const deferPlugin = ({ plugins = [] }: { plugins: string[] }): AnalyticsPlugin => {
  // Store the history of all deferred items
  let history: History = [];

  // Shared method for all page, track and identify start methods
  const startHook =
    (type: string) =>
    ({ payload, instance }: { payload: Payload; abort: (message: string) => null; instance: AnalyticsInstance }) => {
      // Do not process aborted payloads
      if (payload?.abort?.reason) return;

      // For each deferred plugin create a new history item specifically for that plugin
      plugins.forEach((pluginName) => {
        // If the plugin is already enabled then skip deferring it
        if (instance.getState('plugins')[pluginName]?.enabled) return;
        // If the payload specifically targets a plugin that isn't this plugin then skip deferring it
        if (payload.options?.all === false && !payload.options[pluginName]) return;
        // Otherwise create deferred history item targeting this plugin only
        history.push({
          type,
          payload: { ...payload, options: { ...payload.options, all: false, [pluginName]: true } },
        });
      });
    };

  return {
    name: 'defer-plugin',
    loaded: () => true,
    initializeEnd: ({ instance }: { instance: AnalyticsInstance }) => {
      if (typeof document === 'undefined' || typeof window === 'undefined') return;
      // Method only to be run once to enable plugins
      let enabledPlugins = false;
      const enablePluginsImmediate = () => {
        if (enabledPlugins) return;
        instance.plugins.enable(plugins as string & any[]);
        enabledPlugins = true;
      };
      // Method to enable plugins on an event and cleanup listeners after
      const enablePluginsOnEvent = () => {
        enablePluginsImmediate();
        INTERACTION_EVENT_TYPES.forEach((eventType) => document.removeEventListener(eventType, enablePluginsOnEvent));
      };
      // Enable all deferred plugins after certain browser interaction events
      INTERACTION_EVENT_TYPES.forEach((eventType) => document.addEventListener(eventType, enablePluginsOnEvent));
    },
    pageStart: startHook('page'),
    trackStart: startHook('track'),
    identifyStart: startHook('identify'),
    enablePlugin: ({ payload, instance }: { payload: Payload; instance: AnalyticsInstance }) => {
      // When a plugin(s) is enabled, go through each plugin that is going to be enabled
      payload?.plugins.forEach((pluginToEnableName: string) => {
        // Go through each history item and only process the relevant items for this plugin
        history = history.reduce((accumulator: History, { type, payload: itemPayload }) => {
          // Only process history events for plugin being enabled and skip the others
          if (!itemPayload.options[pluginToEnableName]) {
            return accumulator.concat([{ type, payload: itemPayload }]);
          }
          // Set timeout because we wait for the plugins to be enabled, this "enablePlugin" is
          // called before the plugin is enabled.
          // @TODO: Investigate better option
          setTimeout(() => {
            switch (type) {
              case 'page':
                return instance[type](itemPayload.properties, itemPayload.options);
              case 'track':
                return instance[type](itemPayload.event, itemPayload.properties, itemPayload.options);
              case 'identify':
                return instance[type](itemPayload.userId, itemPayload.properties, itemPayload.options);
              default:
                return null;
            }
          }, 100);
          return accumulator;
        }, []);
      });
    },
  } as AnalyticsPlugin;
};

export default deferPlugin;
