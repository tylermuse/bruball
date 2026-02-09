const { extractStandings, fetchEspnStandings, getDefaultSeason } = require('./_lib/standings');
const { applyManualTies } = require('./_lib/manualOverrides');

module.exports = async (req, res) => {
  try {
    const season = req.query.season ?? getDefaultSeason();
    const data = await fetchEspnStandings(season);
    if (!data) {
      res.status(502).json({ error: 'Upstream error' });
      return;
    }

    const teams = applyManualTies(extractStandings(data));
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
