import { LitElement, html, css } from 'lit'

import '../forms/link-map'
import '../forms/link-status'
import '../forms/link-boxconfig'

export class BoxList extends LitElement {
  static get properties() {
    return {
      boxes: { type: Array },
			info: { type: String}
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
				min-height: 0;
				max-width: 40em;
				margin: auto;
			}
			.table {
				flex: 1;
				min-height: 0;
				display: flex;
				flex-direction: column;
			}
			.tbody, .thead {
				display: flex;
				flex-direction: column;
				width: 100%;
			}
			.tbody {
				overflow-y: auto;
			}
			.thead {
				font-weight: bold;
			}
			.table-row {
				display: flex;
				margin: 0.1em;
			}
			.cell {
				flex: 1;
				min-width: 0;
				text-align: left;
				white-space: nowrap;
			}
			.left {
				display: flex;
				justify-content: space-between;

			}
			.button {
				vertical-align: middle;
				background-color: grey;
				display: inline-flex;
				border-radius: 0.75em;
				margin: auto 0.1em;
			}
			.links {
				display: flex;
				padding: 0 0.5em;
			}
			.body.cell.left{
				display: flex;
			}
			.name {
				flex: 1;
			}
			img {
				color: black;
			}
			.banding.possible {
				background-color: green;
				color: white;
			}
			.banding.required {
				background-color: yellow;
			}
			.banding.urgent {
				background-color: orange;
			}
			.banding.overdue {
				background-color: red;
				color: white;
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
						<span class="head cell left">Nistkasten</span>
						<span class="head cell right">${this.info=='BOXES'?'':this.info}</span>
					</div>
				</div>
				<div class="tbody">
					${this.boxes.map(box => html`
						<div class="table-row">
							<span class="body cell left">
								<span class="name">${box.name}</span>
								<span class="links">
									<link-map box_id=${box._id} .nocoor=${!(box.lat && box.lon)}></link-map>
									<link-status box_id=${box._id} .nodata=${box.summaries.length == 0}></link-status>
									<link-boxconfig box_id=${box._id} ></link-boxconfig>
								</span>
							</span>
							<span class="body cell right ${box._info.className}">${this.info=='BOXES'?'':box._info.text}</span>
						</div>
					`)}
				</div>
			</div>
    `
  }

}

customElements.define('box-list', BoxList)
