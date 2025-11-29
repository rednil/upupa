import { html } from 'lit'
import { fixture, expect } from '@open-wc/testing'

import '../src/pages/overview.js';

describe('Overview', () => {
  let element;
  beforeEach(async () => {
    element = await fixture(html`<page-overview></page-overview>`);
  });

  it('renders mode radio', () => {
    const modeRadio = element.shadowRoot.querySelector('input')
    expect(modeRadio).to.exist
  })
  
  /*
  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  })
  */
})
