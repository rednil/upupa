import { mcp } from '../mcp'
import { getAllSummaries } from '../db'
import { translate } from '../translator'
import '../forms/button-exportsvg'
import { ChartBase, day2date } from './base'



export class ChartIncubationSpecies extends ChartBase {
	static get properties() {
		return {
			
		}
	}
	
	
	async fetchData(){
		this.species = await mcp.getByType('species')
		this.summaries = await getAllSummaries()
		this.boxes = await mcp.getByType('box')
	}
	

	
	
	getPlot(){
		if(!(this.summaries)) return ''
		const table = this.summaries
		.map(({key, value}) => {
			const {hatchDate, breedingStart} = value
			const {year,species_id,box_id} = key
			const species = this.species.find(({_id}) => _id == species_id).name
			const incubation = hatchDate && breedingStart ? hatchDate - breedingStart : 0
			if(incubation > 0 && (incubation < 10 || incubation > 20)) {
				const boxName = this.boxes.find(box => box._id == box_id)?.name
				console.warn('Verdächtige Brutdauer', incubation, year, boxName, species)
			}
			return {
				species,
				incubation
			}
		})
		.filter(({incubation}) => (incubation > 0))

		return Plot.plot({
			marginLeft: 100,
			marginRight: 40,
			x: {
				grid: true,
				inset: 6
			},
			
			marks: [
				Plot.boxX(table, {
					x: "incubation",
					y: "species",
					sort: {y: "x", reduce: "mean"}
				}),
				Plot.text(table, Plot.groupY(
					{x: "max"}, // Reducer: calculate the max 'x' value for each group
					{
						x: "incubation",
						y: "species",
						text: d => `n=${d.length}`, // Use the group's length for the text label
						dx: 10,           // Offset text to the right
						textAnchor: "start" // Align text to the l eft
					}
				))
			]
		})
	}
	
}

customElements.define('chart-incubation-species', ChartIncubationSpecies)
