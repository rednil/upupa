import { html } from 'lit'

/* 
Routing can be done via hashed or non-hashed URL paths
See https://blog.bitsrc.io/using-hashed-vs-nonhashed-url-paths-in-single-page-apps-a66234cefc96
When using hashed URLs, 
	* we can use standard <a href=""> links
	* get notified by the onpopstate event
	* do NOT need server side changes in order to serve index.html for every path
When using non-hashed URLs,
	* standard <a href=""> cause a reload of the whole single page application
	* pushState navigation doesn't trigger the onpopstate event (=> we need other means of navigation, e.g. a CustomEvent)
	* the server needs to be changed to serve index.html for every path
*/

// minimalistic router until the lit router works
// see https://github.com/lit/lit/tree/main/packages/labs/router

export function getUrlParams(){
	const params = {}
	const { hash } = window.location
	if(hash.indexOf('?') < 0) return params
	const paramStr = hash.split('?')[1]
	const paramArr = paramStr.split('&')
	paramArr.forEach(param => {
		const [key, value] = param.split('=')
		params[decodeURIComponent(key)] = decodeURIComponent(value)
	})
	return params
}
export function setUrlParams(params, clear){
	const route = window.location.hash.split('?')[0]
	if(!clear){
		params = Object.assign(getUrlParams(), params)
	}
	const paramStr = Object.entries(params)
	.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
	.join('&')
	history.replaceState({},null,`${route}?${paramStr}`)
}
export function getRoute(){
	const hash = window.location.hash
	let route
	if(hash){
		route = routes.find(candidate => hash.search(candidate.path) == 0)
		if(!route) console.error(`Unknown route: ${hash}`)
	}
	if(!route) {
		route = routes.find(candidate => candidate.default == true)
		window.location.hash = route.path
	}
	return route
}
export const routes = [
			{
				path: '#/start',
				menu: true,
				default: true,
				
				render: () => html`
					<page-start id="page"></page-start>
				`
			},
			{
				path: '#/overview',
				menu: true,
				render: () => {
					return html`
					<page-overview id="page"></page-overview>
				`}
			},
			{
				path: '#/status',
				menu: true,
				render: () => html`
					<page-status id="page"></page-status>
				`
			},
			{
				path: '#/calendar',
				menu: true,
				render: () => html`
					<page-calendar id="page"></page-calendar>
				`
			},
			{
				path: '#/analysis',
				menu: true,
				render: () => html`
					<page-analysis id="page"></page-analysis>
				`
			},
			{
				path: '#/inspection',
				render: () => html`
					<page-inspection id="page"></page-inspection>
				`
			},
			{
				path: '#/config',
				menu: true,
				render: () => html`
					<page-config id="page"></page-config>
				`
			},
			{ 
				path: '#/login',
				render: () => html`
					<page-login id="page"></page-login>
				` 
			}
		]