const configModules = import.meta.glob('./tools/*/devPage.config.js', {
  eager: true,
});

function buildDevPageRegistry(modules) {
  const routes = new Map();

  return Object.entries(modules)
    .map(([modulePath, { default: config }]) => {
      if (!config?.slug || !config.label || !config.Component) {
        throw new Error(
          'Every dev page config requires slug, label, and Component.'
        );
      }

      const routeNames = [config.slug, ...(config.aliases ?? [])];
      routeNames.forEach((routeName) => {
        const owner = routes.get(routeName);
        if (owner) {
          throw new Error(
            `Duplicate dev route "${routeName}" in "${owner}" and "${config.slug}".`
          );
        }
        routes.set(routeName, config.slug);
      });

      return {
        ...config,
        aliases: config.aliases ?? [],
        path: `/dev/${config.slug}`,
        sourcePath: `src/dev/${modulePath.replace(/^\.\//u, '').replace(/\/devPage\.config\.js$/u, '')}`,
      };
    })
    .sort(
      (left, right) =>
        (left.order ?? Number.MAX_SAFE_INTEGER) -
          (right.order ?? Number.MAX_SAFE_INTEGER) ||
        left.label.localeCompare(right.label)
    );
}

const DEV_PAGES = buildDevPageRegistry(configModules);

export default DEV_PAGES;
