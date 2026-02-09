
# NFL Team Tracker App

This is a code bundle for NFL Team Tracker App. The original project is available at https://www.figma.com/design/PKAGsl1UidtWWxhrEoMKKG/NFL-Team-Tracker-App.

## Running the code

Install dependencies:

- `npm i`

Start the API server (required for live standings + playoff points):

- `export SPORTSDATAIO_API_KEY=YOUR_KEY`
- `node server/index.js`

Start the frontend:

- `npm run dev`

The app runs on `http://localhost:3000` and proxies `/api` to `http://localhost:5050`.

## SportsData.io

- The API reads standings and playoff results from SportsData.io when `SPORTSDATAIO_API_KEY` is set.
- Do not commit API keys.
- If SportsData.io is unavailable, the UI will fall back to the local `src/data/schedule-2025.json` data.

## Playoff scoring

- Regular season: 1 point per win.
- Wild card win: 1.5 points (teams with a bye also get 1.5).
- Divisional win: 2.5 points.
- Conference win: 3.5 points.
- Super Bowl win: 5 points.


## Tests

- `npm test`
  