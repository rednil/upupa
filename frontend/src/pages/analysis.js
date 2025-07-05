import { html, css } from 'lit'
import { Page } from './base'

export class PageAnalysis extends Page {
	static get styles() {
		return css`
      :host {
				flex:1;
        display: flex;
        align-items: center;
        justify-content: center;
				flex-direction: column;
      }
     
			:host > * {
			
				margin: auto;
			}
			.title {
				text-align: center;
			}
			
    `
  }
	
	connectedCallback(){
		super.connectedCallback()
		this.fetchStatistics()
	}
	async fetchStatistics(){
		const response = await this.proxy.db.query('upupa/statistics', {
			group: true,
			group_level: 2
		})
		console.log('response', response)
		const stats = response.rows.reduce((obj, {key, value}) => {
			Object.assign(key.reduce((obj2, prop) => {
				obj2[prop] = obj2[prop] || {}
				return obj2[prop]
			}, obj), parseValue(value))
			return obj
		}, {})

		console.log('stata', stats)
		this.table = Object.keys(stats.STATE_SUCCESS).reduce((table, year) => {
			const survivors = stats.STATE_SUCCESS[year].nestlings.sum
			const failClutchSize = stats.STATE_FAILURE[year].clutchSize.sum
			const successClutchSize = stats.STATE_SUCCESS[year].clutchSize.sum
			const totalClutchSize = failClutchSize + successClutchSize
			const rate = survivors/totalClutchSize
			table.push({
				year: new Date(`${year}-01-01`),
				rate
			})
			return table
		}, [])
		console.log('table', this.table)
		const plot = Plot.plot({
			marks: [
				Plot.lineY(this.table, {x: "year", y: "rate"})
			]
		})
		const div = this.shadowRoot.querySelector("#myplot");
		div.append(plot);
		//this.requestUpdate()
	}
	render() {
		return html`
			<div>
				<div class="title">Überlebenswahrscheinlichkeit eines Eis, artunabhängig</div>
				<div id="myplot"></div>
			</div>
		`
	}
}
function parseValue([clutchSize, nestlings, nestlingsBanded]){
	return {clutchSize, nestlings, nestlingsBanded}
}
customElements.define('page-analysis', PageAnalysis)
