import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from './tabs';

describe('Tabs', () => {
  it('renders tabs with default value', () => {
    render(
      <TabsRoot defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsPanel value="a">Panel A</TabsPanel>
        <TabsPanel value="b">Panel B</TabsPanel>
      </TabsRoot>
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('Panel A')).toBeInTheDocument();
  });
});
