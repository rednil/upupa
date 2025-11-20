import { Overview } from "./base"

export class OverviewMounting extends Overview{
	async _getInfo(boxes){
		const nameLookup = await this.getNameLookup('mounting')
		return boxes.map(box => this.attachInfo(
			box, 
			nameLookup[box.mounting_id]
		))
	}
}