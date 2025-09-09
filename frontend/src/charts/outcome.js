import { mcp } from '../mcp'
import { translate } from '../translator'
import { ChartBase } from './base'

export class ChartOutcome extends ChartBase {
	static get properties() {
		return {
			normalize: { type: Boolean }, // absolute or relative
			failure: { type: Boolean },
			success: { type: Boolean }
		}
	}
	
	async fetchData(){
		this.perpetrators = await mcp.getByType('perpetrator')
		this.outcome = await mcp.db().query('upupa/outcome', {
			group: true
		})
	}
	
	willUpdate(changed){
		super.willUpdate(changed)
		this.header = this.success 
		? 'Erfolg und Misserfolg' 
		: 'Gründe für Misserfolg'
		this.header = this.header += this.normalize 
		? ', normalisiert'
		: ' in absoluten Zahlen' 
	}
	
	
	getPlot(){
		if(!this.outcome) return ''
		const {rows} = this.outcome
		const allReasons = rows.reduce((allReasons, {key, value}) => {
			return Object.assign(allReasons, value)
		}, {})
		console.log('allReasons', allReasons)
		if(!this.success) delete allReasons.SUCCESS
		if(!this.failure) allReasons = { SUCCESS: allReasons.SUCCESS }
		const firstYear = rows[0].key[0]
		const lastYear = rows[rows.length-1].key[0]
		const table = []
		for(let year = firstYear; year <=lastYear; year ++){
			Object.keys(allReasons).forEach(reason => {
				const row = rows.find(row => row.key[0] == year)
				const predator = this.perpetrators.find(perpetrator => perpetrator._id == reason)?.name
				table.push({
					year: new Date(`${year}-01-01`),
					reason: predator ? translate('PREDATION') + ' ' + predator : translate(reason),
					count: row?.value[reason] || 0
				})
			})
		}
		const options = {
			order: "-sum"
		}
		const y = {}
		if(this.normalize) {
			options.offset = "normalize"
			y.percent = true
		}
		return Plot.plot({
			color: {legend: true},
			y,
			marks: [
				Plot.areaY(table, Plot.stackY(options, {x: "year", y: "count", fill: "reason"})),
			]
		})
	}
}

customElements.define('chart-outcome', ChartOutcome)
