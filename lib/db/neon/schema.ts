// Postgres schema. Applied automatically (idempotently) on first use, the same
// way the Cosmos provider creates its containers on demand.

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id                text PRIMARY KEY,
    email             text NOT NULL,
    name              text NOT NULL DEFAULT '',
    image             text,
    provider          text NOT NULL,
    company_name      text,
    business_type     text,
    hub_analysis_done boolean,
    created_at        timestamptz NOT NULL,
    updated_at        timestamptz NOT NULL,
    last_login_at     timestamptz NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS conversations (
    id                               text PRIMARY KEY,
    user_id                          text NOT NULL,
    title                            text NOT NULL DEFAULT '',
    last_response_id                 text,
    last_response_provider           text,
    initial_analysis_message_sent_at timestamptz,
    hub_question_index               integer,
    created_at                       timestamptz NOT NULL,
    updated_at                       timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS conversations_user_created_idx
    ON conversations (user_id, created_at)`,

  // `seq` keeps insertion order; `id` comes from the client and is only
  // meaningful inside its conversation (e.g. "hub-q-3").
  `CREATE TABLE IF NOT EXISTS messages (
    seq             bigserial PRIMARY KEY,
    conversation_id text NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    id              text NOT NULL,
    role            text NOT NULL CHECK (role IN ('user', 'assistant')),
    content         text NOT NULL,
    timestamp       timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS messages_conversation_idx
    ON messages (conversation_id, seq)`,

  `CREATE TABLE IF NOT EXISTS hub_data (
    id              text PRIMARY KEY,
    user_id         text NOT NULL,
    conversation_id text,
    input           jsonb NOT NULL,
    output          jsonb NOT NULL,
    created_at      timestamptz NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS hub_data_user_created_idx
    ON hub_data (user_id, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS decisions (
    id              text PRIMARY KEY,
    user_id         text NOT NULL,
    scenario        text NOT NULL,
    actions         jsonb NOT NULL,
    hub_score       double precision NOT NULL,
    expected_result text NOT NULL,
    obtained_result text,
    effectiveness   double precision,
    created_at      timestamptz NOT NULL,
    resolved_at     timestamptz
  )`,
];
