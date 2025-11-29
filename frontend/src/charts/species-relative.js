import { getStatsBySpeciesYearState } from '../db/stats'
import { allDocsByType } from '../db/allDocsByType'
import { ChartBase } from './base'

export class ChartSpeciesRelative extends ChartBase {

	async fetchData(){
		this.species = await allDocsByType('species')
		this.stats = await getStatsBySpeciesYearState()
	}
	
	getPlot(){
		if(!(this.stats && this.species)) return ''
		const table = Object.entries(this.stats).reduce((table, [species_id, perSpecies]) => {
			for(let year = 2020; year <= 2025; year++){
			//Object.entries(perSpecies).forEach(([year, {STATE_FAILURE, STATE_SUCCESS}]) => {
				table.push({
					species: this.species.find(({_id}) => _id == species_id).name,
					year: new Date(`${year}-01-01`),
					clutches: (perSpecies[year]?.STATE_FAILURE?.clutchSize.count || 0) + (perSpecies[year]?.STATE_SUCCESS?.clutchSize.count || 0)
				})
			}
			return table
		}, [])
		return Plot.plot({
			color: {legend: true},
			y: {
				
				percent: true
			},
			marks: [
				Plot.areaY(table, Plot.stackY({offset: "normalize"}, {x: "year", y: "clutches", fill: "species"})),
				Plot.ruleY([0, 1])
			]
		})
	}
}

customElements.define('chart-species-relative', ChartSpeciesRelative)
