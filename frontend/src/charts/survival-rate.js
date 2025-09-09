import { mcp } from '../mcp'
import { getStatsBySpeciesYearState } from '../db'
import { translate } from '../translator'
import { ChartBase } from './base'



export class ChartSurvivalRate extends ChartBase {
	static get properties() {
		return {
			type: { type: String } // egg or clutch
		}
	}
	
	
	async fetchData(){
		this.species = await mcp.getByType('species')
		this.stats = await getStatsBySpeciesYearState()
	}
	

	
	
	getPlot(){
		const table = []
		const overall = {}
		const prop = this.type == 'egg' ? 'sum' : 'count'
		Object.entries(this.stats).forEach(([species_id, perSpecies]) => {
			Object.entries(perSpecies).forEach(([year, perYear]) => {
				const survivors = perYear.STATE_SUCCESS?.nestlings[prop] || 0
				const fail = perYear.STATE_FAILURE?.clutchSize[prop] || 0
				const success = perYear.STATE_SUCCESS?.clutchSize[prop] || 0
				const total = fail + success
				const rate = survivors/total
				table.push({
					species: this.species.find(({_id}) => _id == species_id).name,
					year: new Date(`${year}-01-01`),
					rate
				})
				overall[year] = overall[year] || {
					survivors: 0,
					fail: 0,
					success: 0
				}
				overall[year].survivors += survivors
				overall[year].fail += fail
				overall[year].success += success
			})
			
		})
		const overallTable = Object.entries(overall).reduce((arr,[year, {survivors, fail, success}]) => {
			arr.push({
				year: new Date(`${year}-01-01`),
				rate: survivors/(fail+success)
			})
			return arr
		},[])
		return Plot.plot({
			color: {legend: true},
			marks: [
				Plot.line(table, {
					x: "year",
					y: "rate",
					stroke: "species",
					//scale: colorScale
					//symbol: "species",
				}),
				Plot.line(overallTable, {
					x: "year",
					y: "rate",
					strokeWidth: 4
				})
			]
		})
	}
}

customElements.define('chart-survival-rate', ChartSurvivalRate)
