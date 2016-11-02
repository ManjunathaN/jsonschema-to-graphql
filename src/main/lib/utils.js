import _ from 'lodash';

export default {
  isExcluded: (opt, prop) => (opt.include && opt.include.indexOf(prop) === -1) ||
    (opt.exclude && opt.exclude.indexOf(prop) !== -1),
  typeNameForModel: tableName => _.upperFirst(_.camelCase(tableName))
};
