# Oslo demo

Create `main.db`:

```sql
CREATE TABLE user (
    id TEXT PRIMARY KEY,
    github_id INTEGER UNIQUE NOT NULL,
    username TEXT NOT NULL
);

CREATE TABLE session (
    id TEXT PRIMARY KEY,
    expires DATETIME NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

Create Github OAuth app and setup `.env`:

```bash
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

Run application (`http://localhost:4321`):

```
pnpm i
pnpm run dev
```