import { Overview } from "./base"

export class OverviewSpecies extends Overview{
	async _getInfo(boxes, lastInspections){
		const nameLookup = await this.getNameLookup('species')
		return boxes.map(box => {
			const lastInspection = lastInspections[box._id]
			let text = ''
			if(
				lastInspection &&
				(
					lastInspection.species_id ||
					this.speciesShouldBeKnown(lastInspection.state)
				)
			){
				text = nameLookup[lastInspection.species_id] || 'Unbekannt'
			}
			return this.attachInfo(
				box,
				text
			)
			
		})
	}
	speciesShouldBeKnown(state){
		return (
			state != 'STATE_EMPTY' &&
			state != 'STATE_NEST_BUILDING' &&
			state != 'STATE_NEST_READY' &&
			state != 'STATE_OCCUPIED'
		)
	}
}