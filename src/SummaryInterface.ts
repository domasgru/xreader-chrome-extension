import { TweetInterface } from "./TweetInterface";

export interface SummaryInterface {
  writtenSummaryItems: {
    text: string;
    relatedTweets: TweetInterface[];
  }[];
  timeFrom: string;
  timeTo: string;
  media: {
    authorName: string | undefined;
    authorProfileImage: string | undefined;
    images: {
      imageUrl: string | undefined;
      tweetText: string | undefined;
      tweetId: string | undefined;
      tweetLink: string | undefined;
    }[];
  }[];
}
