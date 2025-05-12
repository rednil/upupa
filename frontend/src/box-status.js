import { LitElement, html, css } from 'lit'

export class BoxStatus extends LitElement {
  static get properties() {
    return {
      boxes: { type: Array },
			inspections: { type: Array }
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
				width: 100%;
			}
			:host > div {
				margin: 0 auto;
				display: flex;
				flex-direction: column;
				min-height: 0;
			}
			.inspection {
				padding: 0.5em;
				border-radius: 5px;
				box-shadow: rgba(0, 0, 0, 0.1) 0px 6px 24px 0px;
			}
			.date {
				font-weight: bold;
			}
			#box-select {
				margin-bottom: 1em;
				padding: 0.5em;
			}
			label {
				display: block;
			}
			.list {
				overflow-y: scroll;
			}
    `
  }
	constructor(){
		super()
		this.boxes = []
		this.inspections = []
	}
	
  render() {
    return html`
			<div>
				<label for="box-select">Nest Box</label>
				<select id="box-select" @change=${this._boxSelectCb}>
					${this.boxes.map(({label, _id}) => html`
						<option value="${_id}">${label}</option>
					`)}
				</select>
				<div class="list">
					${this.inspections.map(({date, note}) => html`
						<div class="inspection">
							<div class="date">${new Date(date).toLocaleDateString({}, {dateStyle: 'long'})}</div>
							<div>${note}</div>
						</div>
					`)}
				</div>
			</div>
    `
  }
	connectedCallback(){
    super.connectedCallback()
    this.fetchBoxes()
  }
	async fetchBoxes(){
    const response = await fetch('/api/boxes')
    this.boxes = await response.json()
    await this._fetchInspections(this.boxes[0]._id)
  }
	_boxSelectCb(evt){
		const box_id = evt.target.value
		console.log('boxSelectCb', box_id)
		this._fetchInspections(box_id)
		
	}
	async _fetchInspections(box_id){
		const response = await fetch(`/api/inspections?box_id=${box_id}`)
		this.inspections = await response.json()
		console.log('inspections', this.inspections)
	}
}

customElements.define('box-status', BoxStatus)
