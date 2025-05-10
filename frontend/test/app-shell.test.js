import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import '../src/app-shell.js';

describe('AppShell', () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html`<app-shell></app-shell>`);
  });

  it('renders mwc-drawer', () => {
    const drawer = element.shadowRoot.querySelector('app-menu')
    expect(drawer).to.exist;
  })
  
  /*
  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  })
  */
})
