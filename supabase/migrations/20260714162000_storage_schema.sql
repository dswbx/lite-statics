-- supabase/storage core schema (Postgres)
-- Source: supabase/storage migrations (consolidated)

CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id                 text NOT NULL PRIMARY KEY,
  name               text NOT NULL UNIQUE,
  owner              uuid,
  owner_id           text,
  public             boolean DEFAULT false,
  file_size_limit    bigint,
  allowed_mime_types text[],
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id                 uuid NOT NULL PRIMARY KEY,
  bucket_id          text REFERENCES storage.buckets(id),
  name               text,
  owner              uuid,
  owner_id           text,
  metadata           jsonb,
  user_metadata      jsonb,
  path_tokens        text[],
  version            text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  last_accessed_at   timestamptz DEFAULT now(),

  UNIQUE (bucket_id, name)
);

CREATE INDEX IF NOT EXISTS storage_objects_name_pattern_search ON storage.objects (name text_pattern_ops);
