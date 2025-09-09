import { translate } from '../translator'
import '../forms/button-exportsvg'
import { getAllSummaries } from '../db'
import { ChartBase, day2date } from './base'
export class ChartDateYear extends ChartBase {
	static get properties() {
		return {
			species_id: { type: String },
			type: { type: String }
		}
	}
	
	async fetchData(){
		this.summaries = await getAllSummaries()
		this.requestUpdate()
	}

	getPlot(){
		if(!(this.summaries && this.type)) return ''
		const table = this.summaries
		.filter(({key, value}) => {
			return (
				(!this.species_id || (key.species_id == this.species_id)) &&
				key.occupancy == 1 &&
				value[this.type]
			)
		})
		.map(({key, value}) => {
			const dayOfTheYear = value[this.type]
			return {
				year: key.year,
				date: day2date(dayOfTheYear)
			}
		})
		return Plot.plot({
			marginLeft: 50,
			marginRight: 50,
			x: {
				grid: true,
				inset: 6,
				tickFormat: date => date.toLocaleString(undefined, {
					month: "numeric",
					day: "numeric"
				})
			},
			y: {
				tickFormat: "d" 
			},
			marks: [
				Plot.boxX(table, {
					x: "date",
					y: "year",
				}),
				Plot.text(table, Plot.groupY(
					{x: "max"}, // Reducer: calculate the max 'x' value for each group
					{
						x: "date",
						y: "year",
						text: d => `n=${d.length}`, // Use the group's length for the text label
						dx: 10,           // Offset text to the right
						textAnchor: "start" // Align text to the l eft
					}
				))
			]
		})
	}
	
}

customElements.define('chart-date-year', ChartDateYear)
