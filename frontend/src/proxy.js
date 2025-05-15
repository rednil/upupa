class Proxy {
	async fetch(requests){
		return Promise.all(requests.map(async request => {
			const response = await fetch(`/api/${request.path}`)
			const json = await response.json()
			console.log('response', json)
			return json
		}))
	}
}

export const proxy = new Proxy() 