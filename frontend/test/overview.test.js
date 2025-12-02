import { html } from 'lit'
import { fixture, expect } from '@open-wc/testing'
import { stub } from 'sinon'
import { Overview } from '../src/overview/base.js';
import { currentYear } from '../src/overview/inspection.js';
import '../src/pages/overview.js';

describe('Overview', () => {
  let dbStub, element
  
  beforeEach(async () => {
    dbStub = stub(Overview.prototype, 'getInfo')
    dbStub.resolves([])
    element = await fixture(html`<page-overview></page-overview>`)
  })

  afterEach(() => {
    dbStub.restore();
  })

  it('initially renders a box map', async () => {
    expect(element.infoAssembler.constructor.name).to.equal('OverviewBox')
    expect(dbStub).to.have.been.calledWith(currentYear, 'MAP');
  })
 // Test 1: Select element toggles info to correct Overview class
  it('select element toggles infoAssembler to the correct Overview class', async () => {
    const select = element.shadowRoot.querySelector('select')
    const options = select.querySelectorAll('option')
    
    // Verify initial value is 'BOX'
    expect(options[0].selected).to.be.true;
    expect(element.info).to.equal('BOX')
    
    dbStub.resetHistory()
    // Toggle to ARCHITECTURE
    select.value = 'ARCHITECTURE'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    
    // Verify info property updated
    //expect(element.info).to.equal('ARCHITECTURE')
    await element.updateComplete
    expect(element.infoAssembler.constructor.name).to.equal('OverviewArchitecture')
    expect(dbStub).to.have.been.called
  })
  it('mode radio toggles between LIST and MAP', async () => {
    const mapRadio = element.shadowRoot.querySelector('#modeMap')
    const listRadio = element.shadowRoot.querySelector('#modeList')
    expect(listRadio).to.exist
    expect(mapRadio).to.exist
    dbStub.resetHistory()
    listRadio.checked = true
    listRadio.dispatchEvent(new Event('change'))
    await element.updateComplete
    expect(dbStub).to.have.been.calledWith(currentYear, 'LIST')
    dbStub.resetHistory()
    mapRadio.checked = true
    mapRadio.dispatchEvent(new Event('change'))
    await element.updateComplete
    expect(dbStub).to.have.been.calledWith(currentYear, 'MAP')
  })
  

  
  /*
  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible()
  })
  */
})
