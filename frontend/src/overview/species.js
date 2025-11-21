import { Overview } from "./base"

export class OverviewSpecies extends Overview{
	async _getInfo(boxes){
		const nameLookup = await this.getNameLookup('species')
		return boxes.map(box => {
			const lastInspection = box.lastInspection
			let label = ''
			if(
				lastInspection &&
				(
					lastInspection.species_id ||
					this.speciesShouldBeKnown(lastInspection.state)
				)
			){
				label = nameLookup[lastInspection.species_id] || 'Unbekannt'
			}
			return this.finalize(
				box,
				label
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