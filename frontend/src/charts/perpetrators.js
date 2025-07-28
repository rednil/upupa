import { LitElement, html, css } from 'lit'
import { Proxy } from '../proxy'

export class ChartPerpetrators extends LitElement {
	static get properties() {
		return {
			perpetrators: { type: Array },
			data: { type: Array },
			perpetrator_id: { type: String },
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
		this.proxy = new Proxy(this)
		this.data = []
		this.perpetrators = []
		this.fetchData()
	}
	async fetchData(){
		const [perpetrators, data] = await Promise.all([
			this.proxy.getByType('perpetrator'),
			this.proxy.db.query('upupa/perpetrators', {
				group: true,
				group_level: 3
			})
		])
		this.data = data.rows
		this.perpetrators = perpetrators
		this.findMainPerpetrator()
	}
	findMainPerpetrator(){
		const prevalence = {}
		let mainPerpetrator
		let max = 0
		this.data.forEach(({key, value}) => {
			const perpetrator_id = key[0]
			prevalence[perpetrator_id] = (prevalence[perpetrator_id] || 0) + value.count
			if(prevalence[perpetrator_id] > max){
				max = prevalence[perpetrator_id]
				mainPerpetrator = perpetrator_id
			}
		})
		this.perpetrator_id = mainPerpetrator
	}
	willUpdate(){ 
		this.redraw() 
	}
	
	render() {
		return html`
			<div>Zeitliche Prävalenz von Eindringlingen</div>
			<select-item type="perpetrator" value=${this.perpetrator_id} @change=${this.changeCb}></select-item>
			${this.plot}
		`
	}
	changeCb(evt){
		this.perpetrator_id = evt.target.value
	}
	parseKey(key){
		const [ perpetrator_id, year, week ] = key
		return { perpetrator_id, year, week }
	}
	redraw(){
		const table = this.data
		.filter(({key}) => key[0] == this.perpetrator_id)
		.map(({key, value}) => {
			const statKeys = this.parseKey(key)
			return {
				...statKeys,
				count: value.count
			}
		})
		this.plot = Plot.plot({
			marginLeft: 50,
			marginRight: 50,
			facet: { data: table, y: 'year'},
			marks: [
				Plot.barY(table, {
					x: "week",
					y: "count",
				}),
			]
		})
		this.requestUpdate()
	}
	
}

customElements.define('chart-perpetrators', ChartPerpetrators)
