import PocketBase from 'pocketbase';

const baseUrl = import.meta.env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const pb = new PocketBase(baseUrl);

export default pb;

