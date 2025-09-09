import { html, css, LitElement } from 'lit'
import { translate } from '../translator'
import { setUrlParams } from '../router.js'

import '../analysis/perpetrators.js'
import '../analysis/date.js'
import '../analysis/incubation.js'
import '../analysis/clutchSize.js'
import '../analysis/species.js'
import '../analysis/success.js'
import '../analysis/failure.js'

const pages = [
	{
		id: 'perpetrators',
		html: html`<analysis-perpetrators></analysis-perpetrators>`
	},
	{ 
		id: 'layingstart',
		html: html`<analysis-date type="layingStart"></analysis-date>`
	},
	{ 
		id: 'breedingstart',
		html: html`<analysis-date type="breedingStart"></analysis-date>`
	},
	{ 
		id: 'hatchdate',
		html: html`<analysis-date type="hatchDate"></analysis-date>`
	},
	{
		id: 'incubation',
		html: html`<analysis-incubation></analysis-incubation>`
	},
	{
		id: 'clutchsize',
		html: html`<analysis-clutchsize></analysis-clutchsize>`
	},
	{
		id: 'species',
		html: html`<analysis-species></analysis-species>`
	},
	{
		id: 'success',
		html: html`<analysis-success></analysis-success>`
	},
	{
		id: 'failure',
		html: html`<analysis-failure></analysis-failure>`
	}
]

export class PageAnalysis extends LitElement {
	static get properties() {
		return {
			page: { type: String },
			species_id: { type: String },
			perpetrator_id: { type: String }
		}
	}
	static get styles() {
		return css`
      :host {
				flex:1;
        display: flex;
        align-items: center;
				flex-direction: column;
			}
			.body{
				overflow-y: auto;
				width: 100%;
      }
									
			.head {
				display: flex;
				justify-content: space-between;
				width: 100%;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
				//background-color: lightgrey;
				height: 2em;
				flex-shrink: 0;
				
			}
			.head > * {
				height: 100%;
				background-color: transparent;
			}
			.head > select {
				border: 0;
				outline: none;
				direction: rtl;
				text-align: left;
			}
			.head > div {
				flex: 1;
				box-shadow: 0;
			}
			:head > select > option {
				direction: ltr;
			}
			
    `
  }
	
	selectChartCb(evt){
		this.page = evt.target.value
		setUrlParams({page: this.page})
	}
	selectSpeciesCb(evt){
		this[this.getSpeciesProp()] = evt.target.value
	}
	getSpeciesProp(){
		return this.page == 'perpetrators' ? 'perpetrator_id' : 'species_id'
	}
	updated(){
		const pageNode = this.shadowRoot.querySelector('.body > *')
		pageNode[this.getSpeciesProp()] = this[this.getSpeciesProp()]
		
	}
	render() {
		return html`
			<div class="head">
				<select .value=${this.page} @change=${this.selectChartCb}>
					${pages.map(({id}, idx) => html`
						<option ?selected=${this.page==id} value=${id}>${translate(id)}</option>`)
					}
				</select>
				<div></div>
				<select-item
					type=${this.page == 'perpetrators' ? 'perpetrator' : 'species'}
					class="borderless"
					emptyLabel=${translate('ALL_SPECIES')}
					@change=${this.selectSpeciesCb}>
				</select-item>
			</div>
			<div class="body">
				${(pages.find(({id}) => id==this.page) || pages[0]).html}
			</div>
		`
	}
}

customElements.define('page-analysis', PageAnalysis)
