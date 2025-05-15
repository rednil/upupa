class Proxy {
	async fetch(requests){
		return Promise.all(requests.map(async ({path, query={}}) => {
			const response = await fetch(`/api/${path}${getQueryString(query)}`)
			const json = await response.json()
			return json
		}))
	}
}

function getQueryString(query={}){
	const entries = Object.entries(query)
	if(!entries.length) return ''
	return entries.reduce((queryStr, [key, value]) => queryStr + `${key}=${value}`, '?')
}
export const proxy = new Proxy() 