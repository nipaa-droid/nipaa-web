import { SubmissionStatus } from "@prisma/client";

export class SubmissionStatusUtils {
  static USER_BEST_STATUS: SubmissionStatus[] = [
    SubmissionStatus.BEST,
    SubmissionStatus.APPROVED,
  ];

  static isUserBest(submission: SubmissionStatus) {
    return this.USER_BEST_STATUS.includes(submission);
  }
}
