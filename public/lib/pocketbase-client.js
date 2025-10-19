import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@0.21.1/dist/pocketbase.es.mjs';

const resolveBaseUrl = () => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://127.0.0.1:8090';
  }
  return ${window.location.origin.replace(/\\/+$/, '')}/api/pb;
};

const pb = new PocketBase(resolveBaseUrl());

export default pb;
export { pb };
