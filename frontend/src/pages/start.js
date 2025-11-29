import { html, css, LitElement } from 'lit'
import { getCurrentYearStats } from '../db/summaries'
import { getLevel1Stats } from '../db/stats'

export class PageStart extends LitElement {
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
				max-width: 40em;
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
						<span>${s.clutches}</span>
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
		if(!t) return
		return html`
			<div class="paragraph">
				<div class="head">Insgesamt</div>
				<div class="clutch">
					<div>
						<span>Anzahl Gelege</span>
						<span>${t.nFailure + t.nSuccess}</span>
					</div>
					<div>
						<span>Erfolgreich</span>
						<span>${t.nSuccess}</span>
					</div>
					<div>
						<span>Gescheitert</span>
						<span>${t.nFailure}</span>
					</div>
				</div>
				<div class="total">
					<div>
						<span>Gelegte Eier</span>
						<span>${t.nEggs}</span>
					</div>
					<div>
						<span>Nestlinge ausgeflogen</span>
						<span>${t.nSurvivors}</span>
					</div>
					<div>
						<span>Nestlinge beringt</span>
						<span>${t.nBanded}</span>
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
		this.fetchData()
	}
	async fetchData(){
		this.currentYearStats = await getCurrentYearStats()
		this.totalStats = await getLevel1Stats()
		this.requestUpdate()
	}
	
}

customElements.define('page-start', PageStart)
