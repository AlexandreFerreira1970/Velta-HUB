import type { VeltaUser } from "../../types";
import type { UsersRepository } from "../types";
import { iso, opt, type Row, type SqlClient } from "./sql";

const COLUMNS = `id, email, name, image, provider, company_name, business_type,
  hub_analysis_done, created_at, updated_at, last_login_at`;

function toUser(r: Row): VeltaUser {
  return {
    id: r.id as string,
    email: r.email as string,
    name: r.name as string,
    image: opt(r.image as string | null),
    provider: r.provider as VeltaUser["provider"],
    companyName: opt(r.company_name as string | null),
    businessType: opt(r.business_type as string | null),
    hubAnalysisDone: opt(r.hub_analysis_done as boolean | null),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    lastLoginAt: iso(r.last_login_at),
  };
}

export function createNeonUsers(sql: SqlClient): UsersRepository {
  return {
    async getUserById(id) {
      const [row] = await sql.query(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
      return row ? toUser(row) : null;
    },

    async upsertUser(data) {
      const now = new Date().toISOString();
      const [row] = await sql.query(
        `INSERT INTO users (id, email, name, image, provider, created_at, updated_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $6)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           image = EXCLUDED.image,
           provider = EXCLUDED.provider,
           updated_at = EXCLUDED.updated_at,
           last_login_at = EXCLUDED.last_login_at
         RETURNING ${COLUMNS}`,
        [data.id, data.email, data.name, data.image ?? null, data.provider, now],
      );
      return toUser(row);
    },

    async updateUserProfile(id, data) {
      // Only the fields present in `data` change (NULL keeps the current value).
      const [row] = await sql.query(
        `UPDATE users SET
           company_name = COALESCE($2, company_name),
           business_type = COALESCE($3, business_type),
           hub_analysis_done = COALESCE($4, hub_analysis_done),
           updated_at = $5
         WHERE id = $1
         RETURNING ${COLUMNS}`,
        [
          id,
          data.companyName ?? null,
          data.businessType ?? null,
          data.hubAnalysisDone ?? null,
          new Date().toISOString(),
        ],
      );
      return row ? toUser(row) : null;
    },
  };
}
