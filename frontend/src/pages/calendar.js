import { LitElement, html, css } from 'lit'
import { proxy } from '../proxy'

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
			calendar: { type: Array }
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
			.date, .banding {
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
				overflow-x: scroll;
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
							<a href="${banding ? `#/overview?info=BAND_STATUS_NESTLINGS&box_id=${banding.box_id}` : ''}" class="banding day_${banding?banding.day:'false'}">${banding?banding.box_name:''}</a>	
						`)}
					</div>
				`)}
				
			</div>
		`
	}
	connectedCallback(){
		super.connectedCallback()
		this.fetchData()
	}
	async fetchData(){
		var [summaries, boxes] = await proxy.fetch([
			{path: 'summaries', query: {nestlingsBanded: 0}},
			{path: 'boxes'}
		])
		const events = summaries
		.filter(summary => summary.bandingWindowStart && ((summary.state == 'STATE_EGGS') || (summary.state == 'STATE_NESTLINGS')))
		.map(({box_id, bandingWindowStart, bandingWindowEnd}) => ({
			box_name: boxes.find(box => box._id == box_id).name,
			box_id,
			start: new Date(bandingWindowStart),
			end: new Date(bandingWindowEnd),
		}))
		.sort((a,b) => a.start - b.start)

		const firstEvent = events[0].start
		const lastEvent = events[events.length - 1].end
		const calendar = []
		for(var date = firstEvent; date < lastEvent; date = incDate(date, 1)){
			calendar.push({date, bandings: []})
		}
		events.forEach(event => {
			var column = 0
			var dayIdx = 0
			for(var date = event.start; date < event.end; date = incDate(date, 1)){
				const day = calendar.find(day => day.date.toDateString() == date.toDateString())
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
					console.error('Calendar Error', date, calendar)
				}
				dayIdx++
			}
			
		})
		this.calendar = calendar
	}

}

function incDate(date, days){
	const newDate = new Date(date)
	newDate.setDate(date.getDate() + days)
	return newDate
}
customElements.define('page-calendar', PageCalendar)
