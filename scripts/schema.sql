-- Enable foreign key support in SQLite
PRAGMA foreign_keys = ON;

-- Sites table
CREATE TABLE sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent INTEGER,
    code TEXT NOT NULL CHECK(LENGTH(code) >= 2 AND LENGTH(code) <= 50),
    link_domain TEXT NOT NULL DEFAULT '' CHECK(link_domain = '' OR (LENGTH(link_domain) >= 4 AND LENGTH(link_domain) <= 255)),
    cname TEXT CHECK(cname IS NULL OR (LENGTH(cname) >= 4 AND LENGTH(cname) <= 255)),
    cname_setup_at TEXT,
    settings JSON NOT NULL,
    user_defaults JSON NOT NULL DEFAULT '{}',
    received_data INTEGER NOT NULL DEFAULT 0,
    state TEXT NOT NULL DEFAULT 'a' CHECK(state IN ('a', 'd')),
    created_at TEXT NOT NULL,
    updated_at TEXT,
    first_hit_at TEXT NOT NULL,
    UNIQUE(code),
    UNIQUE(cname),
    FOREIGN KEY (parent) REFERENCES sites(id)
);

-- Analytics Users table (renamed from users)
CREATE TABLE analytics_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    password BLOB,
    totp_enabled INTEGER NOT NULL DEFAULT 0,
    totp_secret BLOB,
    access JSON NOT NULL DEFAULT '{"all":"a"}',
    login_at TEXT,
    login_request TEXT,
    login_token TEXT,
    csrf_token TEXT,
    email_token TEXT,
    reset_at TEXT,
    settings JSON NOT NULL DEFAULT '{}',
    last_report_at TEXT NOT NULL DEFAULT (datetime('now')),
    open_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    UNIQUE(site_id, email)
);

-- API Tokens table
CREATE TABLE api_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    token TEXT NOT NULL CHECK(LENGTH(token) > 10),
    permissions JSON NOT NULL,
    created_at TEXT NOT NULL,
    last_used_at TEXT,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (user_id) REFERENCES analytics_users(id),
    UNIQUE(site_id, token)
);

-- Hits table
CREATE TABLE hits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    ref_id INTEGER NOT NULL DEFAULT 1,
    session BLOB,
    first_visit INTEGER DEFAULT 0,
    bot INTEGER DEFAULT 0,
    browser_id INTEGER NOT NULL,
    system_id INTEGER NOT NULL,
    campaign INTEGER,
    size_id INTEGER,
    location TEXT NOT NULL DEFAULT '',
    language TEXT,
    created_at TEXT NOT NULL,
    user_agent_header TEXT,
    remote_addr TEXT,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    FOREIGN KEY (ref_id) REFERENCES refs(id),
    FOREIGN KEY (browser_id) REFERENCES browsers(id),
    FOREIGN KEY (system_id) REFERENCES systems(id),
    FOREIGN KEY (size_id) REFERENCES sizes(id)
);
CREATE INDEX hits_site_id_created_at ON hits(site_id, created_at DESC);

-- Paths table
CREATE TABLE paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    event INTEGER DEFAULT 0,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    UNIQUE(site_id, path)
);
CREATE INDEX paths_title ON paths(title);

-- Campaigns table
CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Browsers table
CREATE TABLE browsers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    version TEXT
);

-- Systems table
CREATE TABLE systems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    version TEXT
);

-- Refs table
CREATE TABLE refs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT NOT NULL,
    ref_scheme TEXT,
    UNIQUE(ref, ref_scheme)
);
INSERT INTO refs (ref, ref_scheme) VALUES ('', NULL);

-- Sizes table
CREATE TABLE sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    scale REAL NOT NULL,
    size TEXT NOT NULL,
    UNIQUE(size)
);
INSERT INTO sizes (width, height, scale, size) VALUES (0, 0, 0, '0,0,0');

-- Hit Counts table
CREATE TABLE hit_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    hour TEXT NOT NULL,
    total INTEGER NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    UNIQUE(site_id, path_id, hour)
);
CREATE INDEX hit_counts_site_id_hour ON hit_counts(site_id, hour DESC);

-- Ref Counts table
CREATE TABLE ref_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    ref_id INTEGER NOT NULL,
    hour TEXT NOT NULL,
    total INTEGER NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    FOREIGN KEY (ref_id) REFERENCES refs(id),
    UNIQUE(site_id, path_id, ref_id, hour)
);
CREATE INDEX ref_counts_site_id_hour ON ref_counts(site_id, hour ASC);

-- Hit Stats table
CREATE TABLE hit_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    stats TEXT NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    UNIQUE(site_id, path_id, day)
);
CREATE INDEX hit_stats_site_id_day ON hit_stats(site_id, day DESC);

-- Browser Stats table
CREATE TABLE browser_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    browser_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    count INTEGER NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    FOREIGN KEY (browser_id) REFERENCES browsers(id),
    UNIQUE(site_id, path_id, day, browser_id)
);
CREATE INDEX browser_stats_site_id_browser_id_day ON browser_stats(site_id, browser_id, day DESC);

-- System Stats table
CREATE TABLE system_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    system_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    count INTEGER NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    FOREIGN KEY (system_id) REFERENCES systems(id),
    UNIQUE(site_id, path_id, day, system_id)
);
CREATE INDEX system_stats_site_id_system_id_day ON system_stats(site_id, system_id, day DESC);

-- Location Stats table
CREATE TABLE location_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    location TEXT NOT NULL,
    count INTEGER NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    UNIQUE(site_id, path_id, day, location)
);
CREATE INDEX location_stats_site_id_day ON location_stats(site_id, day DESC);

-- Size Stats table
CREATE TABLE size_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    width INTEGER NOT NULL,
    count INTEGER NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    UNIQUE(site_id, path_id, day, width)
);
CREATE INDEX size_stats_site_id_day ON size_stats(site_id, day DESC);

-- Language Stats table
CREATE TABLE language_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    language TEXT NOT NULL,
    count INTEGER NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    UNIQUE(site_id, path_id, day, language)
);
CREATE INDEX language_stats_site_id_day ON language_stats(site_id, day DESC);

-- Campaign Stats table
CREATE TABLE campaign_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    path_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    campaign_id INTEGER NOT NULL,
    ref TEXT NOT NULL,
    count INTEGER NOT NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id),
    FOREIGN KEY (path_id) REFERENCES paths(id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    UNIQUE(site_id, path_id, campaign_id, ref, day)
);
CREATE INDEX campaign_stats_site_id_day ON campaign_stats(site_id, day DESC);

-- Exports table
CREATE TABLE exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    start_from_hit_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    finished_at TEXT,
    last_hit_id INTEGER,
    num_rows INTEGER,
    size TEXT,
    hash TEXT,
    error TEXT,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);
CREATE INDEX exports_site_id_created_at ON exports(site_id, created_at);

-- Locations table
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iso_3166_2 TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT NOT NULL,
    country_name TEXT NOT NULL,
    region_name TEXT NOT NULL,
    UNIQUE(iso_3166_2)
);
INSERT INTO locations (iso_3166_2, country, region, country_name, region_name) VALUES ('', '', '', '(unknown)', '');

-- Languages table
CREATE TABLE languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iso_639_3 TEXT NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(iso_639_3)
);
INSERT INTO languages (iso_639_3, name) VALUES ('', '(unknown)');

-- Store table
CREATE TABLE store (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    value TEXT,
    UNIQUE(key)
);

-- ISO 3166-1 table
CREATE TABLE iso_3166_1 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    alpha2 TEXT,
    UNIQUE(alpha2)
);

-- Version table
CREATE TABLE version (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);
DELETE FROM version;
INSERT INTO version (name) VALUES
    ('2021-03-29-1-widgets'),
    ('2021-04-01-1-store-warn'),
    ('2021-04-02-1-cluster-paths'),
    ('2021-04-07-1-billing-anchor'),
    ('2021-06-27-1-public'),
    ('2021-11-15-1-user-role'),
    ('2021-12-02-1-languages'),
    ('2021-12-02-2-language-enable'),
    ('2021-12-08-1-set-chart-text'),
    ('2021-12-09-1-email-reports'),
    ('2021-12-13-2-superuser'),
    ('2021-12-13-1-drop-role'),
    ('2022-01-13-1-unfk'),
    ('2022-01-14-1-idx'),
    ('2022-02-16-1-rm-billing'),
    ('2022-03-06-1-campaigns'),
    ('2022-10-17-1-campaigns'),
    ('2022-10-21-1-apitoken-lastused'),
    ('2022-11-03-1-uncount'),
    ('2022-11-03-2-ununique'),
    ('2022-11-05-1-paths-title'),
    ('2022-11-15-1-correct-hit-stats'),
    ('2022-11-17-1-open-at'),
    ('2023-05-16-1-hits'),
    ('2023-12-15-1-rm-updates'),
    ('2024-08-19-1-sizes-idx'),
    ('2024-08-19-1-rm-updates2'),
    ('2024-04-23-1-collect-hits');