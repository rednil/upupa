import { allDocsByType } from '../db/allDocsByType'
import { fetchBoxesForYear } from '../db/boxes'
import { fetchLastInspections } from '../db/inspections' 

export const msPerDay = 1000 * 60 * 60 * 24

export class Overview {
	async getInfo(year, mode){
		const boxes = await fetchBoxesForYear(year)
		const lastInspections = await fetchLastInspections(year)
		boxes.forEach(box => box.lastInspection = lastInspections[box._id])
		return await this._getInfo(boxes, { year, mode })
	}
	async getNameLookup(type){
		const response = await allDocsByType(type)
		return response.reduce((obj, {_id, name}) => Object.assign(obj, {[_id]: name}), {})
	}
	finalize(box, label='', classList=[]){
		const { lat, lon, _id, lastInspection, name } = box
		return {
			_id,
			name,
			lat,
			lon,
			label,
			classList,
			lastInspection: lastInspection != null
		}
	}
}