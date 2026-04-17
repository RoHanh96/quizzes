import { notFound } from "next/navigation";
import {
  getQuizWithCrosswordByShareLink,
  isKeywordGloballySolved,
} from "@/modules/quiz/server/queries";
import CrosswordPlayer from "@/modules/quiz/components/player/CrosswordPlayer";
import MultipleChoicePlayer from "@/modules/quiz/components/player/MultipleChoicePlayer";
import { quizTypeSupportsCrosswordPlayer } from "@/modules/quiz/registry";

export default async function PublicPlayPage({
  params,
}: {
  params: { shareLink: string };
}) {
  const quiz = await getQuizWithCrosswordByShareLink(params.shareLink);
  if (!quiz) {
    notFound();
  }

  const keywordGloballySolved =
    quiz.type === "crossword_basic" || quiz.type === "crossword_advanced"
      ? await isKeywordGloballySolved(params.shareLink)
      : false;

  if (quizTypeSupportsCrosswordPlayer(quiz.type)) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <CrosswordPlayer
          quiz={quiz}
          playShareLink={params.shareLink}
          keywordGloballySolved={keywordGloballySolved}
        />
      </div>
    );
  }

  if (quiz.type === "multiple_choice") {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <MultipleChoicePlayer shareLink={params.shareLink} title={quiz.title} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
      <p className="text-gray-600">
        Loại quiz này chưa có màn chơi công khai. Liên hệ admin để cập nhật.
      </p>
    </div>
  );
}
