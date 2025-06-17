import { LitElement, html, css } from 'lit'
import { translate } from '../translator.js'
import '../forms/select-item.js'
export class InspectionDisplay extends LitElement {
	static get properties() {
		return {
			inspection: { type: Object },
			detail: { type: String }
		}
	}
	static get styles() {
		return css`
			:host {
				display: flex;
				flex-direction: column;
			}
			:host > * {
				display: flex;
				justify-content: space-between;
			}
			.head > * {
				flex: 1;
			}
			.head > *:nth-child(2){
				text-align: center;
			}
			.head > *:nth-child(3){
				text-align: right;
			}
			.date {
				font-weight: bold;
			}
			label {
				padding-right: 1em;
			}
			.controls {
				justify-content: center
			}
			a {
				text-decoration: none;
				color: black;
			}
			button {
				width: 100%;
			}
		`
	}
	constructor(){
		super()
		this.detail = 'SHORT'
	}
	render() {
		const {date, note, species_id, type} = this.inspection
		return [
			this.renderHead(),
			this.detail=='LONG' ? this.renderDetails() : '',
			html`<div>Bemerkung: ${note}</div>`,
			this.detail=='LONG' ? this.renderEditButton() : ''
		]	
	}
	renderEditButton(){
		return html`<a href="#/inspection?inspection_id=${this.inspection._id}" class="controls"><button>Edit</button></a>`
	}
	renderHead(){
		const {date, species_id, type} = this.inspection
		return html`
			<div class="head" @click=${this.clickCb}>
				<span class="date">${this.getLongDate(date)}</span>
				${type=='OUTSIDE' ? html`<span></span><span>Nistkasten nicht geöffnet</span>` : html`
					<select-item type="species" .value=${species_id} readonly></select-item>
					<span>${this.getStateLabel(this.inspection)}</span>
				`}
			</div>
		`
	}
	renderDetails(){
		return Object.entries(this.inspection)
		.filter(([key, value]) => !(
			//key.endsWith('_id') ||
			key=='_id' ||
			key=='box_id' ||
			key=='note' ||
			key=='date' ||
			key=='_rev' ||
			key=='type'
		))
		.map(([key, value]) => html`
			<div>
				<label>${translate(key)}</label>
				<span>${this.formatDetailValue(value)}</span>
			</div>`
		)
	}
	getLongDate(date){
		return new Date(date).toLocaleDateString({}, {dateStyle: 'long'})
	}
	formatDetailValue(value){
		if(typeof value == 'string') {
			if(value.match(/\d{4}-\d{2}-\d{2}/)) return this.getLongDate(value)
			//return translate(value)
		}
		return value
	}
	clickCb(){
		this.detail = this.detail == 'SHORT' ? 'LONG' : 'SHORT'
	}
	getStateLabel({state, eggs, nestlings}){
		switch(state){
			case 'STATE_NESTLINGS': return `${nestlings} Nestlinge`
			case 'STATE_EGGS': return `${eggs} Eier`
			default: return translate(state)
		} 
	}
}

customElements.define('inspection-display', InspectionDisplay)
