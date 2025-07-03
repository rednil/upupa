import { html, css } from 'lit'
import { Page } from './base'

export class PageStart extends Page {
	static get styles() {
		return css`
      :host {
				flex:1;
        display: flex;
				justify-content: center;

      }
      :host > div:first-child {
				width: 100%;
				max-width: 20em;
				display: flex;
				flex-direction: column;

      }
			:host > div > div {
				display: flex;
				padding: 2em;
			}
			.clutch, .total {
				flex-direction: column;
			}
			.clutch > div, .total > div {
				display: flex;
				justify-content: space-between;

			}
			.number {
				font-weight: bold
			}
			.year {
				justify-content: center;
				font-weight: bold;
			}
			.version {
				position: absolute;
				right: 0;
				bottom: 0;
			}
    `
  }
	render() {
		const s = this.statistics
		return html`
			<div>
				<div class="year">2025</div>
				<div class="clutch">
					<div>
						<span>Anzahl Gelege</span><span>${this.summaries.length}</span>
					</div>
					<div>
						<span>Am Legen</span><span>${s.STATE_EGGS}</span>
					</div>
					<div>
						<span>Am Brüten</span><span>${s.STATE_BREEDING}</span>
					</div>
					<div>
						<span>Am Füttern</span><span>${s.STATE_NESTLINGS}</span>
					</div>
					<div>
						<span>Bereits ausgeflogen</span><span>${s.STATE_SUCCESS}</span>
					</div>
					<div>
						<span>Gescheitert</span><span>${s.STATE_FAILURE}</span>
					</div>
				</div>
				<div class="total">
					<div>
						<span>Gelegte Eier</span><span>${s.eggs}</span>
					</div>
					<div>
						<span>Nestlinge beringt</span><span>${s.banded}</span>
					</div>
					<div>
						<span>Nestlinge ausgeflogen</span><span>${s.survivors}</span>
					</div>
				</div>
				
			</div>
			<div class="version">Version __APP_VERSION__</div>
			
		`
	}
	constructor(){
		super()
		this.summaries = []
		this.statistics = {}
		this.fetchSummaries()
		this.fetchStatistics()
	}
	async fetchSummaries(){
		const currentYear = new Date().getFullYear()
		this.summaries = await this.proxy.queryReduce('summaries', {
			//startkey: [currentYear],
			//endkey: [currentYear, {}],
			group: true,
			group_level: 3
		})
		this.statistics = this.summaries.reduce((stat, summary) => {
			stat[summary.state] = (stat[summary.state] || 0) + 1
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
			banded: 0
		})
		this.requestUpdate()
	}
	
	async fetchStatistics(){
		const response = await this.proxy.queryReduce('statistics', {
			group: true,
			group_level: 1
		})
		const s = this.statistics = {
			failure: parseStats(response[0]),
			success: parseStats(response[1])
		}
		console.log('s',s)
		this.nBrood = s.failure.clutchSize.count + s.success.clutchSize.count
		this.nSuccessBrood = s.success.clutchSize.count
		this.nEggs = s.success.clutchSize.sum + s.failure.clutchSize.sum
		this.nSurvivors = s.success.nestlings.sum
		this.nBanded = s.failure.nestlingsBanded.sum + s.success.nestlingsBanded.sum
		
		this.requestUpdate()
	}
	
}

function parseStats([clutchSize, nestlings, nestlingsBanded]){
	return {clutchSize, nestlings, nestlingsBanded}
}
customElements.define('page-start', PageStart)
