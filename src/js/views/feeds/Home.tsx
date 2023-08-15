import CreateNoteForm from '@/components/create/CreateNoteForm';
import FeedComponent from '@/components/feed/Feed';
import Show from '@/components/helpers/Show';
import OnboardingNotification from '@/components/OnboardingNotification';
import Events from '@/nostr/Events';
import Key from '@/nostr/Key';
import { Unsubscribe } from '@/nostr/PubSub';
import { ID, PUB } from '@/nostr/UserIds';
import { translate as t } from '@/translations/Translation.mjs';

import SocialNetwork from '../../nostr/SocialNetwork';
import View from '../View';

class Feed extends View {
  unsub?: Unsubscribe;

  constructor() {
    super();
    const followedUsers: string[] = Array.from(
      SocialNetwork.followedByUser.get(ID(Key.getPubKey())) || [],
    ).map((n) => PUB(n));
    this.state = {
      followedUsers,
    };
    this.id = 'message-view';
    this.class = 'public-messages-view';
  }

  componentDidMount() {
    this.restoreScrollPosition();
    this.unsub = SocialNetwork.getFollowedByUser(
      Key.getPubKey(),
      (followedUsers) => {
        console.log('followedUsers', followedUsers);
        this.setState({ followedUsers: Array.from(followedUsers) });
      },
      true,
    );
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.unsub?.();
  }

  renderView() {
    return (
      <div className="flex flex-row">
        <div className="flex flex-col w-full">
          <OnboardingNotification />
          <div className="hidden md:block px-4">
            <CreateNoteForm autofocus={false} placeholder={t('whats_on_your_mind')} />
          </div>
          <Show when={this.state.followedUsers.length}>
            <FeedComponent
              key={`feed-${this.state.followedUsers.length}`}
              filterOptions={[
                {
                  name: t('posts'),
                  filter: { kinds: [1], authors: this.state.followedUsers, limit: 10 },
                  filterFn: (event) => !Events.getEventReplyingTo(event),
                  eventProps: { showRepliedMsg: true },
                },
                {
                  name: t('posts_and_replies'),
                  filter: { kinds: [1], authors: this.state.followedUsers, limit: 5 },
                  eventProps: { showRepliedMsg: true, fullWidth: false },
                },
              ]}
            />
          </Show>
        </div>
      </div>
    );
  }
}

export default Feed;