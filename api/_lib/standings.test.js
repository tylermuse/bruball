import { describe, expect, it } from 'vitest';
import standingsLib from './standings.js';

const { extractStandings } = standingsLib;

describe('extractStandings', () => {
  it('parses the site.api.espn.com shape (children -> children -> standings.entries)', () => {
    const data = {
      children: [
        {
          name: 'American Football Conference',
          children: [
            {
              name: 'AFC East',
              standings: {
                entries: [
                  {
                    team: { displayName: 'Buffalo Bills', abbreviation: 'BUF' },
                    stats: [
                      { name: 'wins', value: 2 },
                      { name: 'losses', value: 0 },
                      { name: 'ties', value: 0 },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const teams = extractStandings(data);
    expect(teams['Buffalo Bills']).toEqual({
      name: 'Buffalo Bills',
      abbreviation: 'BUF',
      wins: 2,
      losses: 0,
      ties: 0,
      seed: 0,
      division: 'AFC East',
      conference: 'American Football Conference',
    });
  });

  it('parses the cdn.espn.com fallback shape (content.standings.groups -> groups -> standings.entries)', () => {
    const data = {
      content: {
        standings: {
          groups: [
            {
              name: 'National Football Conference',
              groups: [
                {
                  name: 'NFC West',
                  standings: {
                    entries: [
                      {
                        team: { displayName: 'San Francisco 49ers', abbreviation: 'SF' },
                        stats: [
                          { name: 'wins', value: '1.0' },
                          { name: 'losses', value: '0.0' },
                          { name: 'ties', value: '0.0' },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    };

    const teams = extractStandings(data);
    expect(teams['San Francisco 49ers']).toEqual({
      name: 'San Francisco 49ers',
      abbreviation: 'SF',
      wins: 1,
      losses: 0,
      ties: 0,
      seed: 0,
      division: 'NFC West',
      conference: 'National Football Conference',
    });
  });

  it('returns an empty map for an unrecognized shape instead of throwing', () => {
    expect(extractStandings({})).toEqual({});
    expect(extractStandings(null)).toEqual({});
  });
});
