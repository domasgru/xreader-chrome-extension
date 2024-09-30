export interface SummaryInterface {
  writtenSummaryItems: {
    text: string;
    ids: string[];
  }[];
  timeFrom: string;
  timeTo: string;
  media: {
    authorName: string;
    authorProfileImage: string;
    images: string[];
  }[];
}
