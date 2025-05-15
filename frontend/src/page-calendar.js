import { LitElement, html, css } from 'lit'
import { proxy } from './proxy'

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
			:host > div {
			}
			.date, .banding {
				padding: 0.5em;
			}
			.banding {
				display: inline-block;
				width: 3em;
				text-align: center;
			}
			.banding.content_true {
				background-color: grey;
			}
			.banding.day_0 {
				padding-top: 0.5em;
			}
			.banding.day_0, .banding.day_4 {
				opacity: 0.5;
				color: grey;
			}
			.banding.day_1, .banding.day_3 {
				opacity: 0.75;
				color: grey;
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
			<div>
				${this.calendar.map(day => html`
					<div class="date">${day.date.toLocaleDateString()}</div>
				`)}
			</div>
			<div class="days">
				
				${this.calendar.map(day => html`
					<div class="day">
						${day.bandings.map(banding => html`
							<div class="banding content_${banding!=null} day_${banding?banding.day:0}">${banding?banding.box_name:''}</div>	
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
			{path: 'summaries'},
			{path: 'boxes'}
		])
		const events = summaries
		.filter(summary => summary.hatchDate)
		.map(({box_id, hatchDate}) => ({
			box_name: boxes.find(box => box._id == box_id).label,
			hatchDate: new Date(hatchDate)
		}))
		.sort((a,b) => a.hatchDate - b.hatchDate)

		const bandingStartAge = 7
		const bandingEndAge = 12

		const firstEvent = incDate(events[0].hatchDate, bandingStartAge)
		const lastEvent = incDate(events[events.length - 1].hatchDate, bandingEndAge)
		const calendar = []
		for(var date = firstEvent; date < lastEvent; date = incDate(date, 1)){
			calendar.push({date, bandings: []})
		}
		events.forEach(event => {
			const bandingStart = incDate(event.hatchDate, bandingStartAge)
			const bandingEnd = incDate(event.hatchDate, bandingEndAge)
			var column = 0
			var dayIdx = 0
			for(var date = bandingStart; date < bandingEnd; date = incDate(date, 1)){
				const day = calendar.find(day => day.date.toDateString() == date.toDateString())
				if(day) {
					if(date == bandingStart){
						column = day.bandings.indexOf(null)
						if(column<0) column = day.bandings.length
					}
					while (day.bandings.length-1 < column) day.bandings.push(null)
					day.bandings[column] = {
						box_name: event.box_name,
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
