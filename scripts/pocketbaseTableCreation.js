import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
);

const sitesCollectionID = 'pbc_2001081480';

// Authenticate as admin

await pb
  .collection('_superusers')
  .authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
console.log('Authenticated as admin');

// const base = await pb.collections.create({
//   name: 'exampleBase',
//   type: 'base',
//   fields: [
//     {
//       name: 'title',
//       type: 'text',
//       required: true,
//       min: 10,
//     },
//     {
//       name: 'status',
//       type: 'bool',
//     },
//   ],
// });

// Create sites collection
// pb.collections.create({
//   name: 'sites',
//   type: 'base',
//   fields: [
//     {
//       name: 'parent',
//       type: 'text',
//     },
//     {
//       name: 'code',
//       type: 'text',
//       required: true,
//       options: { min: 2, max: 50 },
//     },
//     { name: 'link_domain', type: 'text', options: { min: 4, max: 255 } },
//     { name: 'cname', type: 'text', options: { min: 4, max: 255 } },
//     { name: 'cname_setup_at', type: 'date' },
//     { name: 'settings', type: 'json', required: true },
//     { name: 'user_defaults', type: 'json', required: true },
//     { name: 'received_data', type: 'number', required: true },
//     {
//       name: 'state',
//       type: 'select',
//       maxSelect: 1,
//       required: true,
//       values: ['a', 'd'],
//     },
//     { name: 'created_at', type: 'date', required: true },
//     { name: 'updated_at', type: 'date' },
//     { name: 'first_hit_at', type: 'date', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX sites_code ON sites(code)',
//     'CREATE UNIQUE INDEX sites_cname ON sites(cname)',
//   ],
// });

// Create analytics_users collection
// await pb.collections.create({
//   name: 'analytics_users',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     { name: 'email', type: 'email', required: true },
//     { name: 'email_verified', type: 'number', required: true },
//     { name: 'password', type: 'text' }, // BLOB equivalent
//     { name: 'totp_enabled', type: 'number', required: true },
//     { name: 'totp_secret', type: 'text' }, // BLOB equivalent
//     { name: 'access', type: 'json', required: true },
//     { name: 'login_at', type: 'date' },
//     { name: 'login_request', type: 'text' },
//     { name: 'login_token', type: 'text' },
//     { name: 'csrf_token', type: 'text' },
//     { name: 'email_token', type: 'text' },
//     { name: 'reset_at', type: 'date' },
//     { name: 'settings', type: 'json', required: true },
//     { name: 'last_report_at', type: 'date', required: true },
//     { name: 'open_at', type: 'date' },
//     { name: 'created_at', type: 'date', required: true },
//     { name: 'updated_at', type: 'date' },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX analytics_users_site_id_email ON analytics_users(site_id, email)',
//   ],
// });

// Create api_tokens collection
// await pb.collections.create({
//   name: 'api_tokens',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     {
//       name: 'user_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_3719394262', // analytics_users
//     },
//     { name: 'name', type: 'text', required: true },
//     { name: 'token', type: 'text', required: true, options: { min: 11 } },
//     { name: 'permissions', type: 'json', required: true },
//     { name: 'created_at', type: 'date', required: true },
//     { name: 'last_used_at', type: 'date' },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX api_tokens_site_id_token ON api_tokens(site_id, token)',
//   ],
// });

// Create paths collection
// await pb.collections.create({
//   name: 'paths',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     { name: 'path', type: 'text', required: true },
//     { name: 'title', type: 'text', required: true },
//     { name: 'event', type: 'number' },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX `paths_site_id_path` ON `paths`(`site_id`, `path`)',
//     'CREATE INDEX `paths_title` ON paths(`title`)',
//   ],
// });

// Create campaigns collection
// await pb.collections.create({
//   name: 'campaigns',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     { name: 'name', type: 'text', required: true },
//   ],
// });

// Create browsers collection
// await pb.collections.create({
//   name: 'browsers',
//   type: 'base',
//   fields: [
//     { name: 'name', type: 'text' },
//     { name: 'version', type: 'text' },
//   ],
// });

// Create systems collection
// await pb.collections.create({
//   name: 'systems',
//   type: 'base',
//   fields: [
//     { name: 'name', type: 'text' },
//     { name: 'version', type: 'text' },
//   ],
// });

// // Create refs collection
// await pb.collections.create({
//   name: 'refs',
//   type: 'base',
//   fields: [
//     { name: 'ref', type: 'text', required: true },
//     { name: 'ref_scheme', type: 'text' },
//   ],
//   indexes: ['CREATE UNIQUE INDEX refs_ref_ref_scheme ON refs(ref, ref_scheme)'],
// });

// // Create sizes collection
// await pb.collections.create({
//   name: 'sizes',
//   type: 'base',
//   fields: [
//     { name: 'width', type: 'number', required: true },
//     { name: 'height', type: 'number', required: true },
//     { name: 'scale', type: 'number', required: true },
//     { name: 'size', type: 'text', required: true },
//   ],
//   indexes: ['CREATE UNIQUE INDEX sizes_size ON sizes(size)'],
// });

// Create hits collection
// await pb.collections.create({
//   name: 'hits',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     {
//       name: 'path_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1090271482', // path
//     },
//     {
//       name: 'ref_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1942500823', // ref
//     },
//     { name: 'session', type: 'text' }, // BLOB equivalent
//     { name: 'first_visit', type: 'number' },
//     { name: 'bot', type: 'number' },
//     {
//       name: 'browser_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_2643877295', // browser
//     },
// {
//   name: 'system_id',
//   type: 'relation',
//   required: true,
//   maxSelect: 1,
//   minSelect: 0,
//   collectionId: 'pbc_4043220824', // system
// },
//     {
//       name: 'campaign',
//       type: 'relation',
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_2270728936', // campaign
//     },
//     {
//       name: 'size_id',
//       type: 'relation',
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_2111322498', // size
//     },
//     { name: 'location', type: 'text', required: true },
//     { name: 'language', type: 'text' },
//     { name: 'created_at', type: 'date', required: true },
//     { name: 'user_agent_header', type: 'text' },
//     { name: 'remote_addr', type: 'text' },
//   ],
//   indexes: [
//     'CREATE INDEX hits_site_id_created_at ON hits(site_id, created_at DESC)',
//   ],
// });

// Create hit_counts collection
// await pb.collections.create({
//   name: 'hit_counts',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
// {
//   name: 'path_id',
//   type: 'relation',
//   required: true,
//   maxSelect: 1,
//   minSelect: 0,
//   collectionId: 'pbc_1090271482', // path
// },
//     { name: 'hour', type: 'date', required: true },
//     { name: 'total', type: 'number', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX hit_counts_site_id_path_id_hour ON hit_counts(site_id, path_id, hour)',
//     'CREATE INDEX hit_counts_site_id_hour ON hit_counts(site_id, hour DESC)',
//   ],
// });

// Create ref_counts collection
// await pb.collections.create({
//   name: 'ref_counts',
//   type: 'base',
//   fields: [
// {
//   name: 'site_id',
//   type: 'relation',
//   required: true,
//   maxSelect: 1,
//   minSelect: 0,
//   collectionId: sitesCollectionID, // sites
// },
//     {
//       name: 'path_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1090271482', // path
//     },
//     {
//       name: 'ref_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1942500823', // ref
//     },
//     { name: 'hour', type: 'date', required: true },
//     { name: 'total', type: 'number', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX ref_counts_site_id_path_id_ref_id_hour ON ref_counts(site_id, path_id, ref_id, hour)',
//     'CREATE INDEX ref_counts_site_id_hour ON ref_counts(site_id, hour ASC)',
//   ],
// });

// Create hit_stats collection
// await pb.collections.create({
//   name: 'hit_stats',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     {
//       name: 'path_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1090271482', // path
//     },
//     { name: 'day', type: 'date', required: true },
//     { name: 'stats', type: 'text', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX hit_stats_site_id_path_id_day ON hit_stats(site_id, path_id, day)',
//     'CREATE INDEX hit_stats_site_id_day ON hit_stats(site_id, day DESC)',
//   ],
// });

// Create browser_stats collection
// await pb.collections.create({
//   name: 'browser_stats',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     {
//       name: 'path_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1090271482', // path
//     },
//     {
//       name: 'browser_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_2643877295', // browser
//     },
//     { name: 'day', type: 'date', required: true },
//     { name: 'count', type: 'number', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX browser_stats_site_id_path_id_day_browser_id ON browser_stats(site_id, path_id, day, browser_id)',
//     'CREATE INDEX browser_stats_site_id_browser_id_day ON browser_stats(site_id, browser_id, day DESC)',
//   ],
// });

// // Create system_stats collection
// await pb.collections.create({
//   name: 'system_stats',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     {
//       name: 'path_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1090271482', // path
//     },
//     {
//       name: 'system_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_4043220824', // system
//     },
//     { name: 'day', type: 'date', required: true },
//     { name: 'count', type: 'number', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX system_stats_site_id_path_id_day_system_id ON system_stats(site_id, path_id, day, system_id)',
//     'CREATE INDEX system_stats_site_id_system_id_day ON system_stats(site_id, system_id, day DESC)',
//   ],
// });

// Create location_stats collection
// await pb.collections.create({
//   name: 'location_stats',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     {
//       name: 'path_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1090271482', // path
//     },
//     { name: 'day', type: 'date', required: true },
//     { name: 'location', type: 'text', required: true },
//     { name: 'count', type: 'number', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX location_stats_site_id_path_id_day_location ON location_stats(site_id, path_id, day, location)',
//     'CREATE INDEX location_stats_site_id_day ON location_stats(site_id, day DESC)',
//   ],
// });

// Create size_stats collection
// await pb.collections.create({
//   name: 'size_stats',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     {
//       name: 'path_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1090271482', // path
//     },
//     { name: 'day', type: 'date', required: true },
//     { name: 'width', type: 'number', required: true },
//     { name: 'count', type: 'number', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX size_stats_site_id_path_id_day_width ON size_stats(site_id, path_id, day, width)',
//     'CREATE INDEX size_stats_site_id_day ON size_stats(site_id, day DESC)',
//   ],
// });

// Create language_stats collection
// await pb.collections.create({
//   name: 'language_stats',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     {
//       name: 'path_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1090271482', // path
//     },
//     { name: 'day', type: 'date', required: true },
//     { name: 'language', type: 'text', required: true },
//     { name: 'count', type: 'number', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX language_stats_site_id_path_id_day_language ON language_stats(site_id, path_id, day, language)',
//     'CREATE INDEX language_stats_site_id_day ON language_stats(site_id, day DESC)',
//   ],
// });

// Create campaign_stats collection
// await pb.collections.create({
//   name: 'campaign_stats',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     {
//       name: 'path_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_1090271482', // path
//     },
//     { name: 'day', type: 'date', required: true },
//     {
//       name: 'campaign_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: 'pbc_2270728936', // campaign
//     },
//     { name: 'ref', type: 'text', required: true },
//     { name: 'count', type: 'number', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX campaign_stats_site_id_path_id_campaign_id_ref_day ON campaign_stats(site_id, path_id, campaign_id, ref, day)',
//     'CREATE INDEX campaign_stats_site_id_day ON campaign_stats(site_id, day DESC)',
//   ],
// });

// // Create exports collection
// await pb.collections.create({
//   name: 'exports',
//   type: 'base',
//   fields: [
//     {
//       name: 'site_id',
//       type: 'relation',
//       required: true,
//       maxSelect: 1,
//       minSelect: 0,
//       collectionId: sitesCollectionID, // sites
//     },
//     { name: 'start_from_hit_id', type: 'number', required: true },
//     { name: 'path', type: 'text', required: true },
//     { name: 'created_at', type: 'date', required: true },
//     { name: 'finished_at', type: 'date' },
//     { name: 'last_hit_id', type: 'number' },
//     { name: 'num_rows', type: 'number' },
//     { name: 'size', type: 'text' },
//     { name: 'hash', type: 'text' },
//     { name: 'error', type: 'text' },
//   ],
//   indexes: [
//     'CREATE INDEX exports_site_id_created_at ON exports(site_id, created_at)',
//   ],
// });

// // Create locations collection
// await pb.collections.create({
//   name: 'locations',
//   type: 'base',
//   fields: [
//     { name: 'iso_3166_2', type: 'text', required: true },
//     { name: 'country', type: 'text', required: true },
//     { name: 'region', type: 'text', required: true },
//     { name: 'country_name', type: 'text', required: true },
//     { name: 'region_name', type: 'text', required: true },
//   ],
//   indexes: [
//     'CREATE UNIQUE INDEX locations_iso_3166_2 ON locations(iso_3166_2)',
//   ],
// });

// // Create languages collection
// await pb.collections.create({
//   name: 'languages',
//   type: 'base',
//   fields: [
//     { name: 'iso_639_3', type: 'text', required: true },
//     { name: 'name', type: 'text', required: true },
//   ],
//   indexes: ['CREATE UNIQUE INDEX languages_iso_639_3 ON languages(iso_639_3)'],
// });

// // Create store collection
// await pb.collections.create({
//   name: 'store',
//   type: 'base',
//   fields: [
//     { name: 'key', type: 'text', required: true },
//     { name: 'value', type: 'text' },
//   ],
//   indexes: ['CREATE UNIQUE INDEX store_key ON store(key)'],
// });

// // Create iso_3166_1 collection
// await pb.collections.create({
//   name: 'iso_3166_1',
//   type: 'base',
//   fields: [
//     { name: 'name', type: 'text' },
//     { name: 'alpha2', type: 'text' },
//   ],
//   indexes: ['CREATE UNIQUE INDEX iso_3166_1_alpha2 ON iso_3166_1(alpha2)'],
// });

// // Create version collection
// await pb.collections.create({
//   name: 'version',
//   type: 'base',
//   fields: [{ name: 'name', type: 'text' }],
// });

// Insert initial data
// await pb.collection('refs').create({ ref: ' ', ref_scheme: null });
// await pb
//   .collection('sizes')
//   .create({ width: 0, height: 0, scale: 0, size: '0,0,0' });

// await pb.collection('locations').create({
//   iso_3166_2: ' ',
//   country: ' ',
//   region: ' ',
//   country_name: '(unknown)',
//   region_name: ' ',
// });

// await pb.collection('languages').create({ iso_639_3: '', name: '(unknown)' });
await pb.collection('version').create({ name: '2021-03-29-1-widgets' });
await pb.collection('version').create({ name: '2021-04-01-1-store-warn' });
await pb.collection('version').create({ name: '2021-04-02-1-cluster-paths' });
await pb.collection('version').create({ name: '2021-04-07-1-billing-anchor' });
await pb.collection('version').create({ name: '2021-06-27-1-public' });
await pb.collection('version').create({ name: '2021-11-15-1-user-role' });
await pb.collection('version').create({ name: '2021-12-02-1-languages' });
await pb.collection('version').create({ name: '2021-12-02-2-language-enable' });
await pb.collection('version').create({ name: '2021-12-08-1-set-chart-text' });
await pb.collection('version').create({ name: '2021-12-09-1-email-reports' });
await pb.collection('version').create({ name: '2021-12-13-2-superuser' });
await pb.collection('version').create({ name: '2021-12-13-1-drop-role' });
await pb.collection('version').create({ name: '2022-01-13-1-unfk' });
await pb.collection('version').create({ name: '2022-01-14-1-idx' });
await pb.collection('version').create({ name: '2022-02-16-1-rm-billing' });
await pb.collection('version').create({ name: '2022-03-06-1-campaigns' });
await pb.collection('version').create({ name: '2022-10-17-1-campaigns' });
await pb
  .collection('version')
  .create({ name: '2022-10-21-1-apitoken-lastused' });
await pb.collection('version').create({ name: '2022-11-03-1-uncount' });
await pb.collection('version').create({ name: '2022-11-03-2-ununique' });
await pb.collection('version').create({ name: '2022-11-05-1-paths-title' });
await pb
  .collection('version')
  .create({ name: '2022-11-15-1-correct-hit-stats' });
await pb.collection('version').create({ name: '2022-11-17-1-open-at' });
await pb.collection('version').create({ name: '2023-05-16-1-hits' });
await pb.collection('version').create({ name: '2023-12-15-1-rm-updates' });
await pb.collection('version').create({ name: '2024-08-19-1-sizes-idx' });
await pb.collection('version').create({ name: '2024-08-19-1-rm-updates2' });
await pb.collection('version').create({ name: '2024-04-23-1-collect-hits' });
