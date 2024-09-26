export interface TweetInterface {
  retweetAuthor: string | null;
  hasShowMore: boolean;
  tweetText: string | undefined;
  tweetLink: string;
  tweetImages: string[];
  tweetVideoPosters: string[];
  tweetLinkCard: {
    linkCardUrl: string;
    linkCardImage: string | undefined;
    linkCardLink: string | undefined;
    linkCardTitle: string | undefined;
  } | undefined;
  quotedTweet: TweetInterface | null;
  tweetTime: string;
  profileName: string | undefined;
  profileTag: string | undefined;
  profileImage: string | undefined;
  hasReplies: boolean;
  id: string;
  debugData: {
    nodeHtml: string;
  }
}
