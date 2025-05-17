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
					${this.boxes.map(({label, _info, _id, lat, lon}) => html`
						<div class="table-row">
							<span class="body cell left">
								<span class="name">${label}</span>
								<span class="links">
									<link-map box_id=${_id} .nocoor=${!(lat && lon)}></link-map>
									<link-status box_id=${_id} ></link-status>
									<link-boxconfig box_id=${_id} ></link-boxconfig>
								</span>
							</span>
							<span class="body cell right">${this.info=='BOXES'?'':_info}</span>
						</div>
					`)}
				</div>
			</div>
    `
  }

}

customElements.define('box-list', BoxList)
