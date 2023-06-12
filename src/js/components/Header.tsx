import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconFull } from '@heroicons/react/24/solid';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';

import Component from '../BaseComponent';
import Icons from '../Icons';
import localState from '../LocalState';
import Key from '../nostr/Key';
import Relays from '../nostr/Relays';
import { translate as t } from '../translations/Translation.mjs';

import { Button, PrimaryButton } from './buttons/Button';
import Identicon from './Identicon';
import Name from './Name';
import SearchBox from './SearchBox';

export default class Header extends Component {
  chatId = null as string | null;
  iv = null as any;

  constructor() {
    super();
    this.state = { latest: {} };
    this.escFunction = this.escFunction.bind(this);
  }

  escFunction(event) {
    if (event.keyCode === 27) {
      this.state.showMobileSearch && this.setState({ showMobileSearch: false });
    }
  }

  backButtonClicked() {
    window.history.back();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.iv && clearInterval(this.iv);
    document.removeEventListener('keydown', this.escFunction, false);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.escFunction, false);
    localState.get('showParticipants').on(this.inject());
    localState.get('unseenMsgsTotal').on(this.inject());
    localState.get('unseenNotificationCount').on(this.inject());
    localState.get('showConnectedRelays').on(this.inject());
    localState.get('activeRoute').on(
      this.sub((activeRoute) => {
        this.setState({
          about: null,
          title: '',
          activeRoute,
          showMobileSearch: false,
        });
        const replaced = activeRoute.replace('/chat/new', '').replace('/chat/', '');
        this.chatId = replaced.length < activeRoute.length ? replaced : null;
        if (this.chatId) {
          localState.get('channels').get(this.chatId).get('isTyping').on(this.inject());
          localState.get('channels').get(this.chatId).get('theirLastActiveTime').on(this.inject());
        }

        if (activeRoute.indexOf('/chat/') === 0 && activeRoute.indexOf('/chat/new') !== 0) {
          if (activeRoute.indexOf('/chat/') === 0 && this.chatId === Key.getPubKey()) {
            const title = (
              <>
                <b style="margin-right:5px">📝</b> <b>{t('note_to_self')}</b>
              </>
            );
            this.setState({ title });
          } else {
            const title = <Name key={this.chatId} pub={this.chatId || ''} />;
            this.setState({ title });
          }
        }
      }),
    );
    this.updateRelayCount();
    this.iv = setInterval(() => this.updateRelayCount(), 1000);
  }

  onTitleClicked() {
    if (this.chatId && this.chatId.indexOf('hashtag') === -1) {
      const view = this.chatId.length < 40 ? '/group/' : '/';
      route(view + this.chatId);
    }
  }

  onLogoClick(e) {
    e.preventDefault();
    e.stopPropagation();
    (document.querySelector('a.logo') as HTMLElement).blur();
    window.innerWidth > 625 && route('/');
    localState.get('toggleMenu').put(true);
  }

  updateRelayCount() {
    this.setState({ connectedRelays: Relays.getConnectedRelayCount() });
  }

  renderSearchBox() {
    return !this.chatId ? <SearchBox onSelect={(item) => route(`/${item.key}`)} /> : '';
  }

  renderConnectedRelays() {
    return (
      <a
        href="/settings/network"
        class={`connected-peers tooltip mobile-search-hidden ${
          this.state.showMobileSearch ? 'hidden-xs' : ''
        } ${this.state.connectedRelays > 0 ? 'connected' : ''}`}
      >
        <span class="tooltiptext right">{t('connected_relays')}</span>
        <small>
          <span class="icon">{Icons.network}</span>
          <span>{this.state.connectedRelays}</span>
        </small>
      </a>
    );
  }

  renderHeaderText() {
    const { chat, activeRoute } = this.state;
    const isTyping = chat && chat.isTyping;
    const chatting = activeRoute && activeRoute.indexOf('/chat/') === 0;
    return (
      <div
        class="text"
        style={this.chatId ? 'cursor:pointer;text-align:center' : ''}
        onClick={() => this.onTitleClicked()}
      >
        {this.state.title && chatting ? <div class="name">{this.state.title}</div> : ''}
        {isTyping ? <small class="typing-indicator">{t('typing')}</small> : ''}
        {this.state.about ? <small class="participants">{this.state.about}</small> : ''}
        {this.chatId ? <small class="last-seen">{this.state.onlineStatus || ''}</small> : ''}
        {!chatting && (
          <div
            id="mobile-search"
            class={`mobile-search-visible ${this.state.showMobileSearch ? '' : 'hidden-xs'}`}
          >
            {this.renderSearchBox()}
          </div>
        )}
      </div>
    );
  }

  renderMyProfile() {
    const key = Key.getPubKey();
    const npub = Key.toNostrBech32Address(key, 'npub');
    return (
      <Link
        activeClassName="active"
        href={`/${npub}`}
        onClick={() => localState.get('scrollUp').put(true)}
        class="hidden-xs my-profile"
      >
        <Identicon str={npub} width={34} />
      </Link>
    );
  }

  renderNotifications() {
    return (
      <a
        href="/notifications"
        class={`notifications-button mobile-search-hidden ${
          this.state.showMobileSearch ? 'hidden' : ''
        }`}
      >
        {this.state.activeRoute === '/notifications' ? (
          <HeartIconFull width={28} />
        ) : (
          <HeartIcon width={28} />
        )}
        {this.state.unseenNotificationCount ? (
          <span class="unseen">
            {this.state.unseenNotificationCount > 99 ? '' : this.state.unseenNotificationCount}
          </span>
        ) : (
          ''
        )}
      </a>
    );
  }

  renderLoginBtns() {
    return (
      <div class="login-buttons">
        <PrimaryButton small onClick={() => localState.get('showLoginModal').put(true)}>
          {t('log_in')}
        </PrimaryButton>
        <Button small onClick={() => localState.get('showLoginModal').put(true)}>
          {t('sign_up')}
        </Button>
      </div>
    );
  }

  render() {
    const loggedIn = !!Key.getPubKey();
    return (
      <div className="sticky top-0 z-10 w-full cursor-pointer">
        <div className="w-full bg-black md:bg-opacity-50 md:shadow-lg md:backdrop-blur-lg">
          <div className="flex w-full items-center justify-between">
            {loggedIn && this.state.showConnectedRelays && this.renderConnectedRelays()}
            {this.renderHeaderText()}
            {loggedIn && this.renderNotifications()}
            {loggedIn && this.renderMyProfile()}
            {!loggedIn && this.renderLoginBtns()}
          </div>
        </div>
      </div>
    );
  }
}
