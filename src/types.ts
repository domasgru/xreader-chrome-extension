export interface TweetData {
  // Tweet matadata
  retweetAuthor?: string;
  id: string;
  authorName: string;
  authorTag: string;
  authorProfileImage?: string;
  createdAt: string;
  url: string;
  hasShowMore: boolean;
  hasReplies: boolean;

  // Tweet content
  textContent: string;
  images: string[];
  videos: {
    poster: string;
    url?: string;
  }[];
  linkCard?: {
    linkCardUrl: string;
    linkCardImage?: string;
    linkCardLink?: string;
    linkCardTitle?: string;
  };
  tweetQuote?: TweetData;
}

export interface SummaryData {
  timeFrom: string;
  timeTo: string;
  textItems: SummaryTextItemData[];
  mediaItems: SummaryMediaItemData[];
}

export interface SummaryTextItemData {
  text: string;
  relatedTweets: TweetData[];
}

export interface SummaryMediaItemData {
  authorName: string;
  authorProfileImage?: string;
  images: {
    imageUrl: string;
    tweetId: string;
    tweetLink: string;
    tweetText?: string;
  }[];
}

export interface UserPreferences {
  interests: string;
  notInterests: string;
}
