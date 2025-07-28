import { LitElement, html, css } from 'lit'
import { translate } from '../translator'
import { parseKey, parseValue } from './base'

export class SpeciesDates extends LitElement {
	static get properties() {
		return {
		
			data: { type: Array },
			species_id: { type: String },
			dateKey: { type: String }
		}
	}
	static get styles() {
		return css`
      :host {
				
        display: flex;
				flex-direction: column;
        align-items: center;
				
      
		`
	}
	constructor(){
		super()
		this.data = []
	}
	willUpdate(changedProps){ 
		this.redraw() 
	}
	
	render() {
		return html`
			<div>Datumsänderung im Lauf der Jahre</div>
			<select-item autoselect type="species" @change=${this.changeCb}></select-item>
			<select @change=${this.changeCb}>
				<option value="layingStart">${translate('layingStart')}</option>
				<option value="breedingStart">${translate('breedingStart')}</option>
				<option value="hatchDate">${translate('hatchDate')}</option>
			</select>
			${this.plot}
		`
	}
	changeCb(){
		this.species_id = this.shadowRoot.querySelector('select-item').value
		this.dateKey = this.shadowRoot.querySelector('select').value
	}
	redraw(){
		const table = this.data
		.filter(({key, value}) => {
			const statKeys = parseKey(key)
			const statProps = parseValue(value)
			return (
				statKeys.species_id == this.species_id &&
				statKeys.occupancy == 1 &&
				statProps[this.dateKey]
			)
		})
		.map(({key, value}) => {
			const statKeys = parseKey(key)
			const statProps = parseValue(value)
			//const [species_id] = key
			return {
				year: statKeys.year,
				day: statProps[this.dateKey]
			}
		})
		this.plot = Plot.plot({
			marginLeft: 50,
			marginRight: 50,
			x: {
				grid: true,
				inset: 6
			},
			y: {
				tickFormat: "d" 
			},
			marks: [
				Plot.boxX(table, {
					x: "day",
					y: "year",
				}),
				Plot.text(table, Plot.groupY(
					{x: "max"}, // Reducer: calculate the max 'x' value for each group
					{
						x: "day",
						y: "year",
						text: d => `n=${d.length}`, // Use the group's length for the text label
						dx: 10,           // Offset text to the right
						textAnchor: "start" // Align text to the l eft
					}
				))
			]
		})
		this.requestUpdate()
	}
	
}

customElements.define('species-dates', SpeciesDates)
