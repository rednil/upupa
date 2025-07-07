import { html, css } from 'lit'
import { Page } from './base'

export class PageStart extends Page {
	static get styles() {
		return css`
			:host, :host * {
				display: flex;
			}
      :host {
				flex:1;
				justify-content: center;
      }
      :host > div:first-child {
				width: 100%;
				max-width: 20em;
				flex-direction: column;
				margin-bottom: 4em;
      }
			.paragraph {
				flex: 1;
				justify-content: space-around;
			}
			:host > div > div {
				padding: 2em;
				flex-direction: column;
			}
			
			.clutch, .total {
				flex-direction: column;
			}
			.clutch > div, .total > div {
				justify-content: space-between;
			}
			.number {
				font-weight: bold
			}
			.head {
				justify-content: center;
				font-weight: bold;
				font-size: x-large;
			}
			.version {
				position: absolute;
				right: 0;
				bottom: 0;
			}
    `
  }
	render() {
		return html`
			<div>
				${[
					this.renderCurrentYearStats(),
					this.renderTotalStats()
				]}
			</div>
			<div class="version">Version __APP_VERSION__</div>
		`
	}
	renderCurrentYearStats(){
		const s = this.currentYearStats
		if(!s) return ''
		return html`
			<div class="paragraph">
				<div class="head">2025</div>
				<div class="clutch">
					<div>
						<span>Anzahl Gelege</span>
						<span>${this.summaries.length}</span>
					</div>
					<div>
						<span>Am Legen</span>
						<span>${s.STATE_EGGS}</span>
					</div>
					<div>
						<span>Am Brüten</span>
						<span>${s.STATE_BREEDING}</span>
					</div>
					<div>
						<span>Am Füttern</span>
						<span>${s.STATE_NESTLINGS}</span>
					</div>
					<div>
						<span>Bereits ausgeflogen</span>
						<span>${s.STATE_SUCCESS}</span>
					</div>
					<div>
						<span>Gescheitert</span>
						<span>${s.STATE_FAILURE}</span>
					</div>
				</div>
				<div class="total">
					<div>
						<span>Gelegte Eier</span>
						<span>${s.eggs}</span>
					</div>
					<div>
						<span>Nestlinge ausgeflogen</span>
						<span>${s.survivors}</span>
					</div>
					<div>
						<span>Nestlinge beringt</span>
						<span>${s.banded}</span>
					</div>
				</div>
			</div>
		`
	}
	renderTotalStats(){
		const t = this.totalStats
		if(!t) return ''
		const nFailure = t.failure.clutchSize.count
		const nSuccess = t.success.clutchSize.count
		const nEggs = t.failure.clutchSize.sum + t.success.clutchSize.sum
		const nSurvivors = t.success.nestlings.sum
		const nBanded = t.failure.nestlingsBanded.sum + t.success.nestlingsBanded.sum
		return html`
			<div class="paragraph">
				<div class="head">Insgesamt</div>
				<div class="clutch">
					<div>
						<span>Anzahl Gelege</span>
						<span>${nFailure + nSuccess}</span>
					</div>
					<div>
						<span>Erfolgreich</span>
						<span>${nSuccess}</span>
					</div>
					<div>
						<span>Gescheitert</span>
						<span>${nFailure}</span>
					</div>
				</div>
				<div class="total">
					<div>
						<span>Gelegte Eier</span>
						<span>${nEggs}</span>
					</div>
					<div>
						<span>Nestlinge ausgeflogen</span>
						<span>${nSurvivors}</span>
					</div>
					<div>
						<span>Nestlinge beringt</span>
						<span>${nBanded}</span>
					</div>
				</div>
			</div>
		</div>
		`
	}
	constructor(){
		super()
		this.summaries = []
		this.currentYearStats = {}
		this.fetchSummaries()
		this.fetchStatistics()
	}
	async fetchSummaries(){
		const currentYear = new Date().getFullYear()
		this.summaries = await this.proxy.queryReduce('summaries', {
			startkey: [currentYear],
			endkey: [currentYear, {}],
			group: true,
			group_level: 3
		})
		this.currentYearStats = this.summaries.reduce((stat, summary) => {
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
			banded: 0
		})
		this.requestUpdate()
	}
	
	async fetchStatistics(){
		const response = await this.proxy.queryReduce('stats_by_state_year_species', {
			group: true,
			group_level: 1
		})
		const s = this.totalStats = {
			failure: parseStats(response[0]),
			success: parseStats(response[1])
		}
		this.requestUpdate()
	}
	
}

function parseStats([clutchSize, nestlings, nestlingsBanded]){
	return {clutchSize, nestlings, nestlingsBanded}
}
customElements.define('page-start', PageStart)
