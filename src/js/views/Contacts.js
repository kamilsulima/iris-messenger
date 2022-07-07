import { html } from 'htm/preact';
import State from '../State';
import Identicon from '../components/Identicon';
import {translate as t} from '../Translation';
import FollowButton from '../components/FollowButton';
import Name from '../components/Name';
import View from './View';
import Session from '../Session';
import ScrollViewport from 'preact-scroll-viewport';
import SortedMap from 'collections/sorted-map';

// TODO: add group selector
class Contacts extends View {
  state = {sortedKeys: []};
  id = "contacts-view";
  contacts = new SortedMap();

  updateSortedKeys() {
    console.log('this.contacts', this.contacts);
    const sortedKeys = this.contacts.prototype.keys().sort((aK,bK) => {
      const a = this.contacts.get(aK);
      const b = this.contacts.get(bK);
      if (!a.name && !b.name) return aK.localeCompare(bK);
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
    this.setState({sortedKeys});
  }

  shouldComponentUpdate() {
    return true;
  }

  componentDidMount() {
    State.local.get('contacts').map(this.sub(
      (contact, pub) => {
        if (pub === Session.getPubKey()) { return; }
        if (contact) {
          this.contacts.set(pub, contact);
        } else {
          this.contacts.delete(pub);
        }
        this.updateSortedKeys();
      }
    ));
    State.electron && State.electron.get('bonjour').on(s => {
      const nearbyUsers = JSON.parse(s);
      console.log('nearbyUsers', nearbyUsers);
      this.setState({nearbyUsers});
    });
  }

  renderNearbyUsers() {
    return this.state.nearbyUsers.map(peer => {
      const k = peer.txt && peer.txt.user;
      if (!k) { return html`<p>${peer.name}</p>`; }
      return html`
        <div class="profile-link-container">
          ${k ? html`
            <div class="">
              <a href="/profile/${k}" class="profile-link">
                <${Identicon} key="i${k}" str=${k} width=49/>
                <div>
                  <${Name} key="k${k}" pub=${k}/><br/>
                  <small class="follower-count">
                      ${peer.name}<br/>
                      ${this.contacts.has(k) && this.contacts.get(k).followers && this.contacts.get(k).followers.size || '0'} ${t('followers')}
                  </small>
                </div>
              </a>
              ${k !== Session.getPubKey() ? html`<${FollowButton} key="f${k}" id=${k}/>` : ''}
            </div>
          `:''}
        </div>
      `;
    });
  }

  renderView() {
    const keys = this.state.sortedKeys;
    if (keys.length === 0) {
      return html`
      <div class="centered-container">
        ${t('no_contacts_in_list')}
      </div>`
    }

    return html`
      <div class="centered-container">
        <div id="contacts-list">
          ${this.state.nearbyUsers && this.state.nearbyUsers.length ? html`
            <h3>Nearby users</h3>
            ${this.renderNearbyUsers()}
            <hr/><br/>
          `:''}
          <${ScrollViewport}>
            ${keys.map(k => {
              const contact = this.contacts.get(k);
              return html`
              <div class="profile-link-container">
                <a href="/profile/${k}" class="profile-link">
                  <${Identicon} key="i${k}" str=${k} width=49/>
                  <div>
                    <${Name} key="k${k}" pub=${k}/><br/>
                    <small class="follower-count">${contact.followerCount || '0'} ${t('followers')}</small>
                  </div>
                </a>
                ${k !== Session.getPubKey() ? html`<${FollowButton} key="f${k}" id=${k}/>` : ''}
              </div>`;
            })}
          </${ScrollViewport}>
          ${keys.length === 0 ? '—' : ''}
        </div>
      </div>
    `;
  }
}

export default Contacts;
