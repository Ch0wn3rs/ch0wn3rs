import { describe, expect, it } from 'vitest';

import {
  formatDateRange,
  mergePinnedCompetitions,
  parseCompetitionRatings,
  type CtftimeCompetition,
} from './ctftime';

function makeCompetition(overrides: Partial<CtftimeCompetition> = {}): CtftimeCompetition {
  const eventId = overrides.eventId ?? '1000';
  const startAt = overrides.startAt ?? '2026-01-01T00:00:00Z';
  const finishAt = overrides.finishAt ?? '2026-01-02T00:00:00Z';

  return {
    eventId,
    title: overrides.title ?? `Event ${eventId}`,
    place: overrides.place ?? 1,
    ctfPoints: overrides.ctfPoints ?? '100.0000',
    ratingPoints: overrides.ratingPoints ?? '10.000',
    eventUrl: overrides.eventUrl ?? `https://ctftime.org/event/${eventId}/`,
    happenedAt: overrides.happenedAt ?? startAt,
    startAt,
    finishAt,
    dateLabel: overrides.dateLabel ?? formatDateRange(startAt, finishAt),
    modeLabel: overrides.modeLabel ?? 'On-line',
    logoUrl: overrides.logoUrl ?? '',
    isPinned: overrides.isPinned ?? false,
    source: overrides.source ?? 'ctftime',
  };
}

describe('parseCompetitionRatings', () => {
  it('parses rows with plain rating points and weight voting markup', () => {
    const html = `
      <table>
        <tr><td class="place_ico"></td><td class="place">21</td><td><a href="/event/3162">MIPT CTF Quals 2026</a></td><td>2638.0000</td><td>0.000<a href="/event/3162/weight"><i rel="weight_voting" id="weight_voting">*</i></a></td></tr>
        <tr><td class="place_ico"></td><td class="place">24</td><td><a href="/event/3110">DiceCTF 2026 Quals</a></td><td>2072.0000</td><td>80.371</td></tr>
        <tr><td class="place_ico"></td><td class="place">30</td><td><a href="/event/3200">Zero Without Star</a></td><td>1500.0000</td><td>0.000</td></tr>
        <tr><td class="place_ico"></td><td class="place">10</td><td><a href="/event/3098">Batman&#39;s Kitchen CTF 2026</a></td><td>10689.0000</td><td>21.469</td></tr>
      </table>
    `;

    const rows = parseCompetitionRatings(html);

    expect(rows.get('3162')).toMatchObject({
      eventId: '3162',
      title: 'MIPT CTF Quals 2026',
      ctfPoints: '2638.0000',
      ratingPoints: 'TBD',
      place: 21,
    });
    expect(rows.get('3110')).toMatchObject({
      title: 'DiceCTF 2026 Quals',
      ratingPoints: '80.371',
    });
    expect(rows.get('3200')).toMatchObject({
      title: 'Zero Without Star',
      ratingPoints: '0.000',
    });
    expect(rows.get('3098')).toMatchObject({
      title: "Batman's Kitchen CTF 2026",
      ratingPoints: '21.469',
    });
  });
});

describe('mergePinnedCompetitions', () => {
  const fetched = [
    makeCompetition({ eventId: '1001', title: 'Alpha' }),
    makeCompetition({ eventId: '1002', title: 'Beta', place: 2 }),
    makeCompetition({ eventId: '1003', title: 'Gamma', place: 3 }),
  ];

  it('returns fetched competitions unchanged when no pins exist', () => {
    expect(mergePinnedCompetitions(fetched, [])).toEqual(fetched);
  });

  it('moves reference pins to the front and marks them as pinned', () => {
    const merged = mergePinnedCompetitions(fetched, [{ kind: 'reference', eventId: '1002', order: 1 }]);

    expect(merged[0]).toMatchObject({
      eventId: '1002',
      title: 'Beta',
      isPinned: true,
      source: 'pin',
    });
    expect(merged).toHaveLength(3);
  });

  it('supports fully custom pinned competitions', () => {
    const merged = mergePinnedCompetitions(fetched, [
      {
        kind: 'custom',
        id: 'custom-ecsc-2026',
        order: 1,
        title: 'ECSC Training 2026',
        eventUrl: 'https://example.com/ecsc-training-2026',
        place: 1,
        ctfPoints: 'N/A',
        ratingPoints: 'Pinned',
        startAt: '2026-02-01T00:00:00Z',
        finishAt: '2026-02-02T00:00:00Z',
        modeLabel: 'On-line',
        logoUrl: 'https://example.com/logo.png',
      },
    ]);

    expect(merged[0]).toMatchObject({
      eventId: 'custom:custom-ecsc-2026',
      title: 'ECSC Training 2026',
      isPinned: true,
      source: 'pin',
    });
    expect(merged[0].dateLabel).toBe('February 1st - 2nd, 2026');
  });

  it('deduplicates mixed pins and fetched competitions', () => {
    const merged = mergePinnedCompetitions(fetched, [
      { kind: 'reference', eventId: '1001', order: 2 },
      {
        kind: 'custom',
        id: 'custom-alpha',
        order: 1,
        title: 'Pinned Alpha',
        eventUrl: 'https://example.com/pinned-alpha',
        place: 9,
        ctfPoints: 'N/A',
        ratingPoints: 'Pinned',
        startAt: '2026-03-01T00:00:00Z',
        finishAt: '2026-03-02T00:00:00Z',
        modeLabel: 'On-line',
        logoUrl: '',
      },
      { kind: 'reference', eventId: '1001', order: 3 },
    ]);

    expect(merged.map((competition) => competition.eventId)).toEqual([
      'custom:custom-alpha',
      '1001',
      '1002',
      '1003',
    ]);
  });

  it('caps the final list at ten items total', () => {
    const manyFetched = Array.from({ length: 12 }, (_, index) =>
      makeCompetition({
        eventId: String(2000 + index),
        title: `Fetched ${index}`,
        place: index + 1,
      })
    );

    const merged = mergePinnedCompetitions(manyFetched, [
      { kind: 'reference', eventId: '2003', order: 1 },
      { kind: 'reference', eventId: '2004', order: 2 },
      {
        kind: 'custom',
        id: 'custom-top',
        order: 3,
        title: 'Pinned Top',
        eventUrl: 'https://example.com/pinned-top',
        place: 1,
        ctfPoints: 'N/A',
        ratingPoints: 'Pinned',
        startAt: '2026-04-01T00:00:00Z',
        finishAt: '2026-04-02T00:00:00Z',
        modeLabel: 'On-line',
        logoUrl: '',
      },
    ]);

    expect(merged).toHaveLength(10);
    expect(merged.slice(0, 3).map((competition) => competition.eventId)).toEqual([
      '2003',
      '2004',
      'custom:custom-top',
    ]);
  });
});
