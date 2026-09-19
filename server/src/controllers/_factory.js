import { asyncHandler } from '../utils/async-handler.js';

export const make = (service, handlers) => {
  const wrapped = {};
  for (const [name, fn] of Object.entries(handlers)) {
    wrapped[name] = asyncHandler(fn.bind(service));
  }
  return wrapped;
};
