const { extractStandings, fetchEspnStandings, getDefaultSeason } = require('./_lib/standings');

module.exports = async (req, res) => {
  try {
    const season = req.query.season ?? getDefaultSeason();
    const data = await fetchEspnStandings(season);
    if (!data) {
      res.status(502).json({ error: 'Upstream error' });
      return;
    }

    const teams = extractStandings(data);
    res.json({
      season: Number(season),
      updatedAt: new Date().toISOString(),
      teams,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
