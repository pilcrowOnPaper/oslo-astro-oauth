import sqlite from "better-sqlite3";
import { Kysely, SqliteDialect, type ColumnType } from "kysely";

export const db = new Kysely<Database>({
  dialect: new SqliteDialect({
    database: sqlite("main.db"),
  }),
});

interface Database {
  user: UserTable;
  session: SessionTable;
}
export interface UserTable {
  id: string;
  github_id: number;
  username: string;
}

export interface SessionTable {
  id: string;
  expires: string
  user_id: string;
}
