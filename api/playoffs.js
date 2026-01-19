const { fetchSportsDataPlayoffs } = require('./_lib/sportsdata');
const { getDefaultSeason } = require('./_lib/standings');

module.exports = async (req, res) => {
  try {
    const season = req.query.season ?? getDefaultSeason();
    const sportsData = await fetchSportsDataPlayoffs(season);

    if (!sportsData) {
      res.json({
        season: Number(season),
        updatedAt: new Date().toISOString(),
        source: 'sportsdataio',
        hasSportsDataKey: Boolean(process.env.SPORTSDATAIO_API_KEY),
        rounds: [
          { name: 'wildCard', week: 1, points: 1.5 },
          { name: 'divisional', week: 2, points: 2.5 },
          { name: 'conference', week: 3, points: 3.5 },
          { name: 'superBowl', week: 4, points: 5 },
        ],
        playoffWins: {},
        wildcardByes: {},
      });
      return;
    }

    res.json({
      season: Number(season),
      updatedAt: new Date().toISOString(),
      source: 'sportsdataio',
      hasSportsDataKey: Boolean(process.env.SPORTSDATAIO_API_KEY),
      rounds: [
        { name: 'wildCard', week: 1, points: 1.5 },
        { name: 'divisional', week: 2, points: 2.5 },
        { name: 'conference', week: 3, points: 3.5 },
        { name: 'superBowl', week: 4, points: 5 },
      ],
      playoffWins: sportsData.playoffWins,
      wildcardByes: sportsData.wildcardByes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
