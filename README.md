# Defer plugin for `analytics`

Facilitates defering other analytics plugins and their associated events tracked with [analytics](https://www.npmjs.com/package/analytics). For example delay loading `google-tag-manager` in order to increase PageSpeed and once the deferred plugin is loaded then relay the events that occured prior to it loading to the now loaded plugin.

## Installation

```bash
npm install analytics analytics-plugin-defer
```

## How to use

To use, install the package, include in your project and initialize the plugin with [analytics](https://www.npmjs.com/package/analytics).

Below is an example of how to use the browser plugin.

```js
import Analytics from 'analytics';
import googleTagManager from '@analytics/google-tag-manager';
import deferPlugin from 'analytics-plugin-defer';

const analytics = Analytics({
  app: 'example',
  plugins: [
    deferPlugin({ plugins: ['google-tag-manager'] }),
    googleTagManager({
      containerId: 'GTM-123456',
      enabled: false, // @NOTE: Important for `enabled: false` if you want it to be deferred
    }),
  ],
});

/* Track a page view */
analytics.page();

/* Track a custom event */
analytics.track('customEvent', {
  signup: true,
});

/* Identify a visitor */
analytics.identify('user', {
  firstName: 'Foo',
  lastName: 'Bar',
});

/* Deferred plugin will only load and be sent above events once the user iteracts with the page */
```

After initializing `analytics` with the `analyticsDefer` plugin, tracking data will be stored temporarily whenever [analytics.page](https://getanalytics.io/api/#analyticspage), [analytics.track](https://getanalytics.io/api/#analyticstrack), or [analytics.identify](https://getanalytics.io/api/#analyticsidentify) are called and will only be sent after there is interaction with the page upon which the deferred plugin is then loaded and the events are replayed.

### Configuration options

| Option                                 | description                                                                      |
| :------------------------------------- | :------------------------------------------------------------------------------- |
| `plugins` <br/>**required** - string[] | A list of all the plugin names to defer until there is interactoin with the page |
