import { html, css } from 'lit'
import { Page } from './base'
import { translate } from '../translator'

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
export class PageAnalysis extends Page {
	static get styles() {
		return css`
      :host {
				flex:1;
        display: flex;
        align-items: center;
				flex-direction: column;
				overflow-y: auto;
      }
			
			:host > div {
				margin: 1em auto;
			}
			.title {
				text-align: center;
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
    `
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
	getClutchSizePlot(summaries){
		const table = summaries.map(({key, value}) => {
			const [clutchSize] = value
			const [species_id] = key
			return {
				species: this.getSpeciesName(species_id),
				clutchSize
			}
		})

		return Plot.plot({
			marginLeft: 100,
			x: {
				grid: true,
				inset: 6
			},
			
			marks: [
				Plot.boxX(table, {
					x: "clutchSize",
					y: "species",
					sort: {y: "x", reduce: "mean"}
				})
			]
		})

	}
	getIncubationPlot(summaries){
		const table = summaries
		.map(({key, value}) => {
			const [clutchSize, nestlings, nestlingsBanded, incubation] = value
			const [species_id] = key
			return {
				species: this.getSpeciesName(species_id),
				incubation
			}
		})
		.filter(({incubation}) => (incubation > 0))
		return Plot.plot({
			marginLeft: 100,
			x: {
				grid: true,
				inset: 6
			},
			
			marks: [
				Plot.boxX(table, {
					x: "incubation",
					y: "species",
					sort: {y: "x", reduce: "mean"}
				})
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
		var [species, perpetrators, statsBySpeciesYearStateResponse, allSummariesResponse, outcome] = await Promise.all([
			this.proxy.getByType('species'),
			this.proxy.getByType('perpetrator'),
			this.proxy.db.query('upupa/stats_by_species_year_state', {
				group: true,
				group_level: 3
			}),
			this.proxy.db.query('upupa/stats_by_species_year_state', {
				reduce: false
			}),
			this.proxy.db.query('upupa/outcome', {
				group: true
			})
		])
		this.species = species
		this.perpetrators = perpetrators
		//console.log('statsBySpeciesYearStateResponse', statsBySpeciesYearStateResponse)
		const statsBySpeciesYearState = parseResponse(statsBySpeciesYearStateResponse)
		//const statsBySpecies = parseResponse(statsBySpeciesResponse)
		//console.log('allSummariesResponse', allSummariesResponse)
		//console.log('statsBySpeciesYearState', statsBySpeciesYearState)
		this.eggSurvivalPlot = this.getSurvivalPlot(statsBySpeciesYearState, 'sum')
		this.clutchSurvivalPlot = this.getSurvivalPlot(statsBySpeciesYearState, 'count')
		this.speciesPlot = this.getSpeciesPlot(statsBySpeciesYearState)
		this.clutchSizePlot = this.getClutchSizePlot(allSummariesResponse.rows)
		this.incubationPlot = this.getIncubationPlot(allSummariesResponse.rows)
		this.outcomePlot = this.getOutcomePlot(outcome.rows)
		this.reasonForLossPlot = this.getOutcomePlot(outcome.rows, true, true)

		this.requestUpdate()
	}

	render() {
		return html`
			<div>
				<div class="title">Brutdauer</div>
				${this.incubationPlot}
			</div>
			<div>
				<div class="title">Erfolg und Mißerfolg in absoluten Zahlen</div>
				${this.outcomePlot}
			</div>
			<div>
				<div class="title">Gründe für Mißerfolg, normalisiert</div>
				${this.reasonForLossPlot}
			</div>
			<div>
				<div class="title">Gelegegröße</div>
				${this.clutchSizePlot}
			</div>
			<div>
				<div class="title">Überlebensrate von Ei bis Ausflug</div>
				${this.eggSurvivalPlot}
			</div>
			<div>
				<div class="title">Erfolgsrate eines Geleges</div>
				${this.clutchSurvivalPlot}
			</div>
			<div>
				<div class="title">Artenzusammensetzung</div>
				${this.speciesPlot}
			</div>
			
		`
	}
}
function parseValue([clutchSize, nestlings, nestlingsBanded, incubation]){
	return {clutchSize, nestlings, nestlingsBanded, incubation}
}
customElements.define('page-analysis', PageAnalysis)
