import { mcp } from "../mcp"

export async function getCurrentYearStats(){
		const currentYear = new Date().getFullYear()
		const summaries = await mcp.db()
		.query('upupa/summaries', {
			startkey: [currentYear],
			endkey: [currentYear, {}],
			group: true,
			group_level: 3
		})
		.then(({rows}) => rows.map(({key, value}) => value))
		const currentYearStats = summaries.reduce((stat, summary) => {
			stat[summary.state] = (stat[summary.state] || 0) + 1
			if(typeof summary.clutchSize != 'number') console.error('Wrong type', summary.clutchSize)
			if(summary.clutchSize == 0 || summary.clutchSize > 20 || summary.clutchSize == null) console.error('Faulty clutchSize', summary)
			stat.eggs += summary.clutchSize
			stat.banded += summary.nestlingsBanded || 0
			if(summary.state == 'STATE_SUCCESS') {
				stat.survivors += summary.nestlings
				if(isNaN(summary.nestlings)) console.error('isNaN(summary.nestlings', summary)
			}
			return stat
		}, {
			eggs: 0,
			survivors: 0,
			banded: 0,
			clutches: summaries.length
		})
		return currentYearStats
	}