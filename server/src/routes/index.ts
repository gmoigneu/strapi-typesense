export default [
  {
    method: 'GET',
    path: '/',
    // name of the controller file & the method.
    handler: 'controller.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/config',
    // name of the controller file & the method.
    handler: 'config.index',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/index-all',
    // name of the controller file & the method.
    handler: 'indexall.indexAll',
    config: {
      policies: [],
      auth: false,
    },
  }
];
