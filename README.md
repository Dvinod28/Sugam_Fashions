## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root and set your backend URL:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Run the dev server:

```bash
npm run dev
```

The app uses an API client at `src/api/client.js` and reads the base URL from `import.meta.env.VITE_API_BASE_URL`. Products are fetched via `GET /products`. Auth endpoints used: `POST /auth/login`, `POST /auth/signup`.
