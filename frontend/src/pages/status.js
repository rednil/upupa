import { LitElement, html, css } from 'lit'
import '../forms/select-item.js'
import { Proxy } from '../proxy.js'
import '../forms/link-map.js'
import '../forms/link-boxconfig.js'
import '../components/inspection-display.js'
import '../components/summary-display.js'


export class PageStatus extends LitElement {
  static get properties() {
    return {
      boxes: { type: Array },
			inspections: { type: Array },
			species: { type: Array },
			summaries: { type: Array },
			box_id: { type: String }
    }
  }

  static get styles() {
    return css`
      :host, :host > div, .top, .controls, .left {
				display: flex;	
			}
			:host, :host > div, .controls {
				flex: 1;
			}
			:host > div {
				flex-direction: column;
				min-height: 0;
			}
			inspection-display, summary-display, .controls{
				margin: 0 auto;
				padding: 0.5em;
				border-radius: 5px;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
				max-width: 40em;
				justify-content: space-between;
			}
			.inspection .date, .summary .head {
				font-weight: bold;
			}
			.top {
				overflow-y: scroll;
				flex-shrink: 0;
			}
			.bottom {
				overflow-y: scroll;
			}
			link-map, link-boxconfig {
				padding-left: 0.5em;
			}
			.nodata {
				text-align: center;
				padding: 1em;
			}
			 a {
				margin: auto 0;
			}
			
    `
  }
	constructor(){
		super()
		this.proxy = new Proxy(this)
		this.boxes = []
		this.inspections = []
		this.summaries = []
		this.species = []
	}
	
	boxHasNoCoors(){
		const box = this.boxes.find(box => box._id == this.box_id)
		return box && !(box.lat && box.lon)
	}
  render() {
    return html`
			<div>
				<div class="top">
					<div class="controls">
						<div class="left">
							<select-item buttons id="select-box"  type="box" .value=${this.box_id} autoselect @change=${this._boxSelectCb}></select-item>
							<link-map .box_id=${this.box_id} .nocoor=${this.boxHasNoCoors()}></link-map>
							<link-boxconfig .box_id=${this.box_id}></link-boxconfig>
						</div>
						<a href="#/inspection?box_id=${this.box_id}">
							<button>NK-Kontrolle</button>
						</a>
					</div>
				</div>
				<div class="bottom">
					${this.inspections.length == 0 ? html`
						<div class="nodata">Keine Inspektionen</div>
					`:''}
					${this.summaries.map(summary => html`
						<summary-display .summary=${summary} ></summary-display>
					`)}
					${this.inspections.map(inspection => html`
						<inspection-display .inspection=${inspection} ></inspection-display>
					`)}
				</div>
			</div>
    `
  }
	
	firstUpdated(){
		if(this.box_id){
			this._fetchData(this.box_id)
		}
	}
	
	_boxSelectCb(evt){
		this.box_id = evt.target.value
		history.replaceState({},null,`#/status?box_id=${this.box_id}`)
		this._fetchData(this.box_id)
	}
	async _fetchData(box_id){
		var [boxes, inspections=[], summaries=[]] = await Promise.all([
			this.proxy.getByType('box'),
			this.proxy.queryReduce('inspections', {
				endkey: [2025, box_id],
				startkey: [2025, box_id, {}],
				reduce: false,
				descending: true
			}),
			this.proxy.queryReduce('summaries', {
				group: true,
				group_level: 3,
				endkey: [2025, box_id],
				startkey: [2025, box_id, {}],
				descending: true
			}),
		])
		Object.assign(this, {inspections, summaries, boxes})
	}
}

customElements.define('page-status', PageStatus)
