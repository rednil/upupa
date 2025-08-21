import { html, css } from 'lit'
import { Page } from './base'
import { pm } from '../projectManager'
import '../components/view-db'

export class PageDatabase extends Page {
  
  static get properties() {
    return {
      
    }
  }

  static get styles() {
    return css`
      :host {
				flex:1;
        display: flex;
        justify-content: center;
        overflow-y: auto;
        
      }
      :host > div {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 30em;
      }
      
      view-db {
        padding: 1em;
      }
			
    `
  }
  constructor(){
    super()
    this.init()
  }
  
  async init(){
    this.project = await pm.getSelectedProject()
    this.requestUpdate()
  }

  

  render() {
    return html`
      <div>
        <view-db .db=${pm._db} label="projectDB" deletable @delete=${this.deleteCb}></view-db>
        ${this.renderProject()}
      </div>
    `
  }
  renderProject(){
    if(!this.project) return ''
    return html`
      ${['localDB', 'remoteDB', 'userDB'].map(db => html`
        <view-db .db=${this.project[db]} label=${db} .deletable=${db!='remoteDB'} @delete=${this.deleteCb}></view-db>
      `)}
    `
  }
  async deleteCb(evt){
    const {label, db, info} = evt.target
    //console.log(evt.target.label, db)
    const response = await db.destroy()
    console.log('destroy response', response)
    if(label == 'local'){
      const dbs = await window.indexedDB.databases()
      dbs.forEach(db => { 
        //console.log('db', db)
        if(db.name.startsWith(`_pouch_${info.db_name}-`)){
          console.log('delete', db.name)
          window.indexedDB.deleteDatabase(db.name)
        }
        
      })
    }
    window.location.reload()
  }
  async cleanupViews(){
    const response = await getLocalDb().viewCleanup()
    console.log('viewCleanup response', response)
    
  }

}

customElements.define('page-database', PageDatabase)
