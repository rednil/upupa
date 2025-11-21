import { Overview } from "./base"

export class OverviewArchitecture extends Overview {
	async _getInfo(boxes){
		const nameLookup = await this.getNameLookup('architecture')
		return boxes.map(box => this.finalize(
			box, 
			nameLookup[box.architecture_id]
		))
	}
}