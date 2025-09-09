import { html, css, LitElement } from 'lit'
import { translate } from '../translator'
import '../analysis/perpetrators.js'
import '../analysis/date.js'
import '../analysis/incubation.js'
import '../analysis/clutchSize.js'
import '../analysis/species.js'
import '../analysis/success.js'
import { parseValue } from '../charts/base.js'
import { mcp } from '../mcp.js'
import '../forms/button-exportsvg.js'
import { setUrlParams } from '../router.js'
const pages = [
	{
		id: 'perpetrators',
		html: html`<analysis-perpetrators></analysis-perpetrators>`
	},
	{ 
		id: 'layingstart',
		html: html`<analysis-date type="layingStart"></analysis-date>`
	},
	{ 
		id: 'breedingstart',
		html: html`<analysis-date type="breedingStart"></analysis-date>`
	},
	{ 
		id: 'hatchdate',
		html: html`<analysis-date type="hatchDate"></analysis-date>`
	},
	{
		id: 'incubation',
		html: html`<analysis-incubation></analysis-incubation>`
	},
	{
		id: 'clutchsize',
		html: html`<analysis-clutchsize></analysis-clutchsize>`
	},
	{
		id: 'species',
		html: html`<analysis-species></analysis-species>`
	},
	{
		id: 'success',
		html: html`<analysis-success></analysis-success>`
	},
	{
		id: 'failure',
		html: html`<analysis-failure></analysis-failure>`
	}
]

function parseResponse(response, reverse=false){
	return response.rows.reduce((obj, {key, value}) => {
		if(reverse) key = key.toReversed()
		Object.assign(key.reduce((obj, prop) => {
			obj[prop] = obj[prop] || {}
			return obj[prop]
		}, obj), parseValue(value))
		return obj
	}, {})
}
export class PageAnalysis extends LitElement {
	static get properties() {
		return {
			page: { type: String },
			species_id: { type: String }
		}
	}
	static get styles() {
		return css`
      :host {
				flex:1;
        display: flex;
        align-items: center;
				flex-direction: column;
			}
			.body{
				overflow-y: auto;
				width: 100%;
      }
			
			.body > * {
				margin: 1em auto;
			}
			.title {
				display: flex;
				justify-content: space-between;
			}
			figure > svg {
				width: 100%;
			}
			figure {
				margin-block-start: 0.5em;
				margin-block-end: 0.5em;
				margin-inline-start: 0.5em;
				margin-inline-end: 0.5em;
			}
			.head {
				display: flex;
				justify-content: space-between;
				width: 100%;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
				//background-color: lightgrey;
				height: 2em;
				flex-shrink: 0;
			}
			.head > * {
				height: 100%;
				background-color: transparent;
			}
			.head > select {
				border: 0;
				outline: none;
				direction: rtl;
				text-align: left;
			}
			.head > div {
				flex: 1;
				box-shadow: 0;
			}
			:head > select > option {
				direction: ltr;
			}
			
    `
  }
	constructor(){
		super()
		this.pageIdx = 0
		this.allSummaries = []
	}
	connectedCallback(){
		super.connectedCallback()
		this.fetchStatistics()
	}
	getOutcomePlot(rows, failureOnly = false, relative = false){
		const allReasons = rows.reduce((allReasons, {key, value}) => {
			return Object.assign(allReasons, value)
		}, {})
		if(failureOnly) delete allReasons.SUCCESS
		const firstYear = rows[0].key[0]
		const lastYear = rows[rows.length-1].key[0]
		const table = []
		for(let year = firstYear; year <=lastYear; year ++){
			Object.keys(allReasons).forEach(reason => {
				const row = rows.find(row => row.key[0] == year)
				const predator = this.perpetrators.find(perpetrator => perpetrator._id == reason)?.name
				table.push({
					year: new Date(`${year}-01-01`),
					reason: predator ? translate('PREDATION') + ' ' + predator : translate(reason),
					count: row?.value[reason] || 0
				})
			})
		}
		return Plot.plot({
			color: {legend: true},
			y: relative ? { percent: true } : {},
			marks: [
				Plot.areaY(table, Plot.stackY(relative ? {offset: "normalize"} : {}, {x: "year", y: "count", fill: "reason"})),
			]
		})
		
	}
	
	getSpeciesPlot(stats){
		const table = Object.entries(stats).reduce((table, [species_id, perSpecies]) => {
			for(let year = 2020; year <= 2025; year++){
			//Object.entries(perSpecies).forEach(([year, {STATE_FAILURE, STATE_SUCCESS}]) => {
				table.push({
					species: this.getSpeciesName(species_id),
					year: new Date(`${year}-01-01`),
					clutches: (perSpecies[year]?.STATE_FAILURE?.clutchSize.count || 0) + (perSpecies[year]?.STATE_SUCCESS?.clutchSize.count || 0)
				})
			}
			return table
		}, [])
		return Plot.plot({
			color: {legend: true},
			y: {
				
				percent: true
			},
			marks: [
				Plot.areaY(table, Plot.stackY({offset: "normalize"}, {x: "year", y: "clutches", fill: "species"})),
				Plot.ruleY([0, 1])
			]
		})
	}
	getSurvivalPlot(stats, prop){
		const table = []
		const overall = {}
		Object.entries(stats).forEach(([species_id, perSpecies]) => {
			Object.entries(perSpecies).forEach(([year, perYear]) => {
				const survivors = perYear.STATE_SUCCESS?.nestlings[prop] || 0
				const fail = perYear.STATE_FAILURE?.clutchSize[prop] || 0
				const success = perYear.STATE_SUCCESS?.clutchSize[prop] || 0
				const total = fail + success
				const rate = survivors/total
				table.push({
					species: this.getSpeciesName(species_id),
					year: new Date(`${year}-01-01`),
					rate
				})
				overall[year] = overall[year] || {
					survivors: 0,
					fail: 0,
					success: 0
				}
				overall[year].survivors += survivors
				overall[year].fail += fail
				overall[year].success += success
			})
			
		})
		const overallTable = Object.entries(overall).reduce((arr,[year, {survivors, fail, success}]) => {
			arr.push({
				year: new Date(`${year}-01-01`),
				rate: survivors/(fail+success)
			})
			return arr
		},[])
		return Plot.plot({
			color: {legend: true},
			marks: [
				Plot.line(table, {
					x: "year",
					y: "rate",
					stroke: "species",
					//scale: colorScale
					//symbol: "species",
				}),
				Plot.line(overallTable, {
					x: "year",
					y: "rate",
					strokeWidth: 4
				})
			]
		})
	}
	getSpeciesName(species_id){
		return this.species.find(spec => spec._id == species_id).name
	}
	async fetchStatistics(){
		var [species, boxes, perpetrators, statsBySpeciesYearStateResponse, allSummariesResponse, outcome] = await Promise.all([
			mcp.getByType('species'),
			mcp.getByType('box'),
			mcp.getByType('perpetrator'),
			mcp.db().query('upupa/stats_by_state_year_species', {
				group: true,
				group_level: 3
			}),
			mcp.db().query('upupa/stats_by_state_year_species', {
				reduce: false
			}),
			mcp.db().query('upupa/outcome', {
				group: true
			})
		])
		this.species = species
		this.boxes = boxes
		this.perpetrators = perpetrators
		this.allSummaries = allSummariesResponse.rows
		//console.log('statsBySpeciesYearStateResponse', statsBySpeciesYearStateResponse)
		const statsBySpeciesYearState = parseResponse(statsBySpeciesYearStateResponse, true)
		//const statsBySpecies = parseResponse(statsBySpeciesResponse)
		console.log('allSummariesResponse', allSummariesResponse)
		//console.log('statsBySpeciesYearState', statsBySpeciesYearState)
		this.eggSurvivalPlot = this.getSurvivalPlot(statsBySpeciesYearState, 'sum')
		this.clutchSurvivalPlot = this.getSurvivalPlot(statsBySpeciesYearState, 'count')
		this.speciesPlot = this.getSpeciesPlot(statsBySpeciesYearState)
	
		this.outcomePlot = this.getOutcomePlot(outcome.rows)
		this.reasonForLossPlot = this.getOutcomePlot(outcome.rows, true, true)

		this.requestUpdate()
	}

	selectChartCb(evt){
		this.page = evt.target.value
		setUrlParams({page: this.page})
	}
	selectSpeciesCb(evt){
		this.species_id = evt.target.value
	}
	updated(){
		const pageNode = this.shadowRoot.querySelector('.body > *')
		console.log('pageNode', pageNode, this.species_id)
		pageNode.species_id = this.species_id
	}
	render() {
		console.log('analysis render', this.page)
		return html`
			<div class="head">
				<select .value=${this.page} @change=${this.selectChartCb}>
					${pages.map(({id}, idx) => html`
						<option ?selected=${this.page==id} value=${id}>${translate(id)}</option>`)
					}
				</select>
				<div></div>
				<select-item
					type="species"
					class="borderless"
					emptyLabel=${translate('ALL_SPECIES')}
					@change=${this.selectSpeciesCb}>
				</select-item>
				
			</div>
			<div class="body">

					
				${(pages.find(({id}) => id==this.page) || pages[0]).html}
				
				
				
			
				<div>
					<div class="title">
						<div>Erfolg und Mißerfolg in absoluten Zahlen</div>
						<button-exportsvg name="success-absolute.svg"></button-exportsvg>
					</div>
					${this.outcomePlot}
				</div>
				<div>
					<div class="title">
						<div>Gründe für Mißerfolg, normalisiert</div>
						<button-exportsvg name="failure.svg"></button-exportsvg>
					</div>
					${this.reasonForLossPlot}
				</div>
				
				<div>
					<div class="title">
						<div>Überlebensrate von Ei bis Ausflug</div>
						<button-exportsvg name="survival.svg"></button-exportsvg>
					</div>
					${this.eggSurvivalPlot}
				</div>
				<div>
					<div class="title">
						<div>Erfolgsrate eines Geleges</div>
						<button-exportsvg name="success-relative.svg"></button-exportsvg>
					</div>
					${this.clutchSurvivalPlot}
				</div>
				<div>
					<div class="title">
						<div>Artenzusammensetzung</div>
						<button-exportsvg name="species.svg"></button-exportsvg>
					</div>
					${this.speciesPlot}
				</div>
			</div>
		`
	}
}

customElements.define('page-analysis', PageAnalysis)
