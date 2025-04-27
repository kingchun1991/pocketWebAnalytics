import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
);

// Authenticate as admin
const siteCode = 'localhost:3000';
await pb
  .collection('_superusers')
  .authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
console.log('Authenticated as admin');
const site = await pb
  .collection('sites')
  .getFirstListItem(`code="${siteCode}"`);
