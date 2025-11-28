import { getByType, parsePerpetratorsKey } from '../db'
import { mcp } from '../mcp'
import { ChartBase, day2date } from './base'

export class ChartPerpetratorsDate extends ChartBase {
	static get properties() {
		return {
			perpetrators: { type: Array },
			data: { type: Array },
			perpetrator_id: { type: String },
		}
	}
	
	async fetchData(){
		this.perpetrators = await getByType('perpetrator'),
		this.data = await	mcp.db().query('upupa/perpetrators', {
			group: true,
			group_level: 3
		})
		//this.findMainPerpetrator()
	}
	/*
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
	*/
	
	getPlot(){
		if(!this.data) return ''
		const table = this.data.rows
		.filter(({key}) => !this.perpetrator_id || (key[0] == this.perpetrator_id))
		.map(({key, value}) => {
			const { perpetrator_id, year, week } = parsePerpetratorsKey(key)
			const date = day2date(week*7-3)
			return {
				year,
				week,
				date,
				perpetrator: this.perpetrators.find(({_id}) => _id == perpetrator_id).name,
				count: value.count
			}
		})
		return Plot.plot({
			color: {legend: true},
			marginLeft: 50,
			marginRight: 50,
			facet: { data: table, y: 'year'},
			fy: {
				tickFormat: "d" // Format the facet 'y' labels as decimal integers
			},
			x: {
				type: 'time',	
				tickFormat: date => date.toLocaleString(undefined, {
					month: "numeric",
					day: "numeric"
				})
			},
			marks: [
				Plot.rectY(table, {
					x: "date",
					y: "count",
					fill: "perpetrator",
					order: "-sum",
					interval: "week"
				}),
			]
		})
	}
	
}

customElements.define('chart-perpetrators-date', ChartPerpetratorsDate)
