import type { Book, Question } from "../types";
import { newId } from "../ids";

export const addQuestion = (
  books: Book[],
  bookId: string,
  chapterId: string,
  question: Omit<Question, "id">,
): Book[] =>
  books.map((b) =>
    b.id === bookId
      ? {
          ...b,
          chapters: b.chapters.map((c) =>
            c.id === chapterId
              ? {
                  ...c,
                  questions: [...c.questions, { ...question, id: newId() }],
                }
              : c,
          ),
        }
      : b,
  );
