export const map = doc =>  {
	if (doc.type == 'inspection' && doc.occupancy) {
		const date = new Date(doc.date)
		emit([date.getFullYear(), doc.box_id, doc.occupancy], { date: date.getTime(), _id:doc._id}) 
	}
}
export const reduce = (keys, values, rereduce) => {
  let output
  values.forEach((input) => {
    if (!output || input.date > output.date) {
      output = input
    }
  })
  return output 
}

export const summaries = {
	map: map.toString(),
	reduce: reduce.toString()
}
