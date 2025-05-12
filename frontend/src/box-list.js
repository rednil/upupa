import { LitElement, html, css } from 'lit'

export class BoxList extends LitElement {
  static get properties() {
    return {
      boxes: { type: Array }
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
				width: 100%;
			}
			.table {
				min-height: 0;
				display: flex;
				flex-direction: column;
				margin: auto;
			}
			.tbody, .thead {
				display: flex;
				flex-direction: column;
				width: 100%;
			}
			.tbody {
				overflow-y: scroll;
			}
			.thead {
				font-weight: bold;
			}
			.table-row {
				display: flex;
				
			}
			span {
				flex: 1;
				min-width: 0;
				text-align: left;
				white-space: nowrap;
			}
			
    `
  }
	constructor(){
		super()
		this.boxes = []
	}
	
  render() {
    return html`
			<div class="table">
				<div class="thead">
					<div class="table-row">
						<span>Label</span>
						<span>Site</span>
						<span>Position</span>
					</div>
				</div>
				<div class="tbody">
					${this.boxes.map(({label, site, lat, lon}) => html`
						<div class="table-row">
							<span>${label}</span>
							<span>${site}</span>
							<span>${lat}, ${lon}</span>
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
    
  }

}

customElements.define('box-list', BoxList)
