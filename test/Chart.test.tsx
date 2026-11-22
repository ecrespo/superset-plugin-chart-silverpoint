// SUP-REQ-005, SUP-REQ-006, SUP-REQ-007, SUP-REQ-009 (SUP-T-04, SUP-T-05): the component draws the
// spec through the chart's @silverpoint/react component, loaded lazily by slug.
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test } from 'vitest';
import SilverpointChart from '../src/shared/Chart';
import { CHARTS } from '../src/catalog.generated';
import { transformPropsFor } from '../src/shared/transformProps';

const props = (width: number) => transformPropsFor(CHARTS['bar-chart']!)({ width, height: 300, formData: { role_x: ['team'], role_value: 'count', title: 'Teams' }, queriesData: [{ data: [{ team: 'A', count: 3 }, { team: 'B', count: 5 }] }] } as never);

describe('component', () => {
  test('SUP-REQ-005 · draws the chart with its accessible name', async () => {
    const { container } = render(<SilverpointChart {...props(500)} />);
    await waitFor(() => expect(container.querySelector('svg.sp-chart')).not.toBeNull());
    expect(screen.getByRole('group', { name: /Teams/ })).toBeTruthy();
  });

  test('SUP-REQ-006 · fills the size Superset gives and follows it', async () => {
    const { container, rerender } = render(<SilverpointChart {...props(500)} />);
    await waitFor(() => expect(container.querySelector('svg.sp-chart')?.getAttribute('width')).toBe('500'));
    expect(container.querySelector('svg.sp-chart')?.getAttribute('height')).toBe('300');
    rerender(<SilverpointChart {...props(320)} />);
    await waitFor(() => expect(container.querySelector('svg.sp-chart')?.getAttribute('width')).toBe('320'));
  });

  test('SUP-REQ-007 · a binding error is thrown for Superset\'s error boundary', () => {
    const bad = transformPropsFor(CHARTS['bar-chart']!)({ width: 1, height: 1, formData: { role_x: ['team'], role_value: 'count' }, queriesData: [{ data: [{ team: 'A' }] }] } as never);
    const spy = console.error;
    console.error = () => undefined;
    expect(() => render(<SilverpointChart {...bad} />)).toThrow(/no column "count"/);
    console.error = spy;
  });
});
