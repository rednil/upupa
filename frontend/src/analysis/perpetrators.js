import { LitElement, html, css } from 'lit'
import { mcp } from '../mcp'
import { ChartBase } from '../charts/base'

export class AnalysisPerpetrators extends ChartBase {
	static get properties() {
		return {
			perpetrators: { type: Array },
			data: { type: Array },
			perpetrator_id: { type: String },
		}
	}
	
	async fetchData(){
		this.perpetrators = await mcp.getByType('perpetrator'),
		this.data = await	mcp.db().query('upupa/perpetrators', {
			group: true,
			group_level: 3
		})
		//this.findMainPerpetrator()
	}
	findMainPerpetrator(){
		const prevalence = {}
		let mainPerpetrator
		let max = 0
		this.data.rows.forEach(({key, value}) => {
			const perpetrator_id = key[0]
			prevalence[perpetrator_id] = (prevalence[perpetrator_id] || 0) + value.count
			if(prevalence[perpetrator_id] > max){
				max = prevalence[perpetrator_id]
				mainPerpetrator = perpetrator_id
			}
		})
		this.perpetrator_id = mainPerpetrator
	}

	parseKey(key){
		const [ perpetrator_id, year, week ] = key
		return { perpetrator_id, year, week }
	}
	getPlot(){
		if(!this.data) return ''
		const table = this.data.rows
		.filter(({key}) => !this.perpetrator_id || (key[0] == this.perpetrator_id))
		.map(({key, value}) => {
			const statKeys = this.parseKey(key)
			return {
				...statKeys,
				count: value.count
			}
		})
		return Plot.plot({
			marginLeft: 50,
			marginRight: 50,
			facet: { data: table, y: 'year'},
			fy: {
				tickFormat: "d" // Format the facet 'y' labels as decimal integers
			},
			marks: [
				Plot.barY(table, {
					x: "week",
					y: "count",
				}),
			]
		})
	}
	
}

customElements.define('analysis-perpetrators', AnalysisPerpetrators)
