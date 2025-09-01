## WAL (Expo React Native)

### Platform support

- This React Native app is tested on macOS only. Development on other OSes may work but is not supported at the moment.
- The backend server can be run easily on any platform via Docker.

### Requirements

- Docker
- Node.js (18+ recommended)
- A good Mac; 16GB RAM recommended for smooth development

### Backend

- Backend repository: [WAL Server](https://github.com/walofficial/wal-server)
- By default, the backend listens at `http://localhost:5500`.

### Setup (minimal)

```bash
npm i
```

You only need your Supabase URL and Anon Key. Create a new [Supabase project](https://supabase.com/dashboard/sign-in) to obtain them.

Create a `.env.development` file in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_DISABLE_FIREBASE=true
```

### Run

```bash
# Build for you sinmulator
npx expo run:ios or npx expo run:android

# If you need to publish expo dev server on LAN do this
npm start
```

That’s it. With the backend on `http://localhost:5500` and the Supabase env set, the frontend and backend are connected.


### Additional notes

- The new architecture from Expo/React Native has performance issues on Android, and LiveKit does not support the new architecture yet. There are no plans to migrate at this time.
- You will need to add a test phone number in Supabase and set up phone number authentication with Twilio to log into the app. Twilio’s test setup is free.
