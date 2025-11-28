import { html, css, LitElement } from 'lit'
import { mcp } from '../mcp'
import { getByType } from '../db'

function formatDate(date){
	return date.toLocaleString(window.navigator.language,{
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	})
}
function dateClass(date){
	const day = date.getDay()
	if(day == 6 || day == 0) return 'weekend'
}
export class PageCalendar extends LitElement {
	static get properties() {
		return {
			//calendar: { type: Array },
			year: { type: Number }
		}
	}

	static get styles() {
		return css`
			:host {
				overflow-y: auto;
				display: block;
				flex-direction: row;
				display: flex;
			}
			.dates {
				padding-right: 0.5em;
			}
			.date, .day > * {
				padding: 0.5em;
				white-space: nowrap;
			}
			.date.weekend {
				background-color: rgba(0,200,0,0.5)
			}
			.banding {
				display: inline-block;
				width: 3em;
				text-align: center;
				color: rgba(0,0,0,0);
			}
			
			.banding.day_0 {
				background-image: linear-gradient(to bottom, rgba(0,200,0,0), rgba(0,200,0,0.5));
			}
			.banding.day_1 {
				background-image: linear-gradient(to bottom, rgba(0,200,0,0.5), rgba(0,200,0,1));
			}
			.banding.day_2 {
				background-image: linear-gradient(to bottom, rgba(00,200,0,1), rgba(200,200,0,1));
				color: black;
			}
			.banding.day_3 {
				background-image: linear-gradient(to bottom, rgba(200,200,00,1), rgba(200,100,00,1));
			}
			.banding.day_4 {
				background-image: linear-gradient(to bottom, rgba(200,100,00,1), rgba(200,00,00,1));
			}
			
			.days {
				overflow-x: auto;
				white-space: nowrap;
				height: fit-content;
			}
			.day {
				height: initial;
				display: block;
			}
			
			
		`
	}
	constructor(){
		super()
		this.calendar = []
	}
	
	render() {
		return html`
			<div class="dates">
				${this.calendar.map(day => html`
					<div class="date ${dateClass(day.date)}">${formatDate(day.date)}</div>
				`)}
			</div>
			<div class="days">
				
				${this.calendar.map(day => html`
					<div class="day">
						${day.bandings.map(banding => html`
							<a href="${banding ? `#/overview?info=BAND_STATUS_NESTLINGS&box_id=${banding.box_id}` : ''}" class="banding day_${banding?banding.day:'false'}">${banding?banding.box_name:'---'}</a>	
						`)}
						${day.bandings.length?'':html`<div>&nbsp;</div>`}
					</div>
				`)}
				
			</div>
		`
	}
	updated(changedProps){
		if(changedProps.has('year')) this.fetchData()
	}
	async fetchData(){
		this.calendar = []
		var [summaries, boxes] = await Promise.all([
			mcp.db()
			.query('upupa/summaries', {
				group: true,
				group_level: 2,
				endkey: [this.year],
				startkey: [this.year, {}],
				descending: true
			})
			.then(({rows}) => rows.map(({key, value}) => value)),
			getByType('box')
		])
		const events = summaries
		.filter(summary => (
			!summary.nestlingsBanded &&
			summary.bandingWindowStart && 
			(
				(summary.state == 'STATE_EGGS') || 
				(summary.state == 'STATE_NESTLINGS') || 
				(summary.state == 'STATE_BREEDING')
			)
		))
		.map(({box_id, bandingWindowStart, bandingWindowEnd}) => ({
			box_name: boxes.find(box => box._id == box_id).name,
			box_id,
			start: new Date(bandingWindowStart),
			end: new Date(bandingWindowEnd),
		}))
		.sort((a,b) => a.start - b.start)
		if(!events.length) return this.requestUpdate()
		const firstEvent = events[0].start
		const lastEvent = events[events.length - 1].end
		
		for(var date = firstEvent; date < lastEvent; date = incDate(date, 1)){
			this.calendar.push({date, bandings: []})
		}
		events.forEach(event => {
			var column = 0
			var dayIdx = 0
			for(var date = event.start; date < event.end; date = incDate(date, 1)){
				const day = this.calendar.find(day => day.date.toDateString() == date.toDateString())
				if(day) {
					if(date == event.start){
						column = day.bandings.indexOf(null)
						if(column<0) column = day.bandings.length
					}
					while (day.bandings.length-1 < column) day.bandings.push(null)
					day.bandings[column] = {
						box_name: event.box_name,
						box_id: event.box_id,
						day: dayIdx
					}
				}
				else {
					console.error('Calendar Error', date, this.calendar)
				}
				dayIdx++
			}
			
		})
		//this.calendar = calendar
		this.requestUpdate()
	}

}

export function incDate(date, days){
	const newDate = new Date(date)
	newDate.setDate(newDate.getDate() + days)
	return newDate
}
customElements.define('page-calendar', PageCalendar)
