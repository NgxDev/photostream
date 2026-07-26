import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <ps-empty-state heading="Nothing saved yet" icon="favorite" message="Photos you save will live here.">
      <button type="button">Browse photos</button>
    </ps-empty-state>
  `,
})
class EmptyStateHost {}

describe('EmptyState', () => {
  let fixture: ComponentFixture<EmptyStateHost>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(EmptyStateHost);
    await fixture.whenStable();
  });

  function text(selector: string): string | undefined {
    return fixture.nativeElement.querySelector(selector)?.textContent?.trim();
  }

  it('shows the heading and the message it was given', () => {
    expect(text('h1')).toBe('Nothing saved yet');
    expect(text('p')).toBe('Photos you save will live here.');
  });

  it('hides its icon from screen readers', () => {
    expect(text('mat-icon')).toBe('favorite');
    expect(fixture.nativeElement.querySelector('mat-icon').getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the action it was given', () => {
    expect(text('button')).toBe('Browse photos');
  });
});
