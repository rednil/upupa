import { msPerDay, Overview } from "./base"

const currentYear = new Date().getFullYear()

export class OverviewInspection extends Overview {
	async _getInfo(boxes){
		return boxes.map(box => {
			let label = 'Keine'
			let classList = ['last_inspection']
			const lastInspection = box.lastInspection
			if(lastInspection){
				const daysPassed = Math.round((new Date().getTime() - new Date(lastInspection.date).getTime()) / msPerDay)
				if(!this.year || this.year == currentYear){
					label = `${daysPassed}d`
					if(daysPassed < 1) classList.push('lt1d')
					else if(daysPassed < 7) classList.push('lt7d')
					else classList.push('gt7d')
				}
				else label = new Date(lastInspection.date).toLocaleDateString()
			}
			return this.finalize(box, label, classList)
		})
	}
}