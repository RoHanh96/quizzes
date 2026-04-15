"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CrosswordPreview from "./CrosswordPreview";
import { normalizeKeyword } from "@/modules/quiz/lib/text";
import {
  validateBasicDraftMessage,
  getBasicAnswerErrorsByPosition,
} from "@/modules/quiz/validation/crossword-basic";
import { computeRC } from "@/modules/quiz/lib/crossword-advanced-grid";
import {
  ADVANCED_IMAGE_MIN_BYTES,
  advancedImageTooSmallMessage,
} from "@/modules/quiz/validation/crossword-advanced";

interface CrosswordQuestion {
  id?: string;
  question: string;
  answer: string;
  position: number;
  /** Chỉ dùng cho advanced; basic do server gán `letterIndex`. */
  letterIndex?: number;
}

export interface CrosswordEditorProps {
  type: "crossword_basic" | "crossword_advanced";
  initialData?: {
    id?: string;
    title: string;
    verticalWord?: string;
    secretWord?: string;
    imageUrl?: string;
    questions: CrosswordQuestion[];
  };
}

export default function CrosswordEditor({ type, initialData }: CrosswordEditorProps) {
  const router = useRouter();
  const advancedFileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialData?.title || "");
  const [verticalWord, setVerticalWord] = useState(initialData?.verticalWord || "");
  const [secretWord, setSecretWord] = useState(initialData?.secretWord || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [questions, setQuestions] = useState<CrosswordQuestion[]>(
    initialData?.questions?.length
      ? initialData.questions
      : [createEmptyQuestion(1)]
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  function createEmptyQuestion(position: number): CrosswordQuestion {
    return {
      question: "",
      answer: "",
      position,
    };
  }

  const handleAddQuestion = () => {
    if (type === "crossword_basic") {
      return;
    }
    setQuestions([...questions, createEmptyQuestion(questions.length + 1)]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (type === "crossword_basic") {
      return;
    }
    if (questions.length <= 1) {
      setError("Quiz phải có ít nhất 1 câu hỏi");
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    newQuestions.forEach((q, i) => {
      q.position = i + 1;
    });
    setQuestions(newQuestions);
  };

  useEffect(() => {
    if (type !== "crossword_basic") return;

    const N = normalizeKeyword(verticalWord).length;

    setQuestions((prev) => {
      const sorted = [...prev].sort((a, b) => a.position - b.position);

      if (N === 0) {
        if (
          sorted.length === 1 &&
          !sorted[0].question?.trim() &&
          !sorted[0].answer?.trim()
        ) {
          return sorted;
        }
        return [createEmptyQuestion(1)];
      }

      const next: CrosswordQuestion[] = [];
      for (let i = 0; i < N; i++) {
        const existing = sorted[i];
        next.push(
          existing
            ? { ...existing, position: i + 1 }
            : createEmptyQuestion(i + 1)
        );
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đồng bộ số hàng theo N; createEmptyQuestion phụ thuộc type
  }, [type, verticalWord]);

  const basicDraftHint = useMemo(() => {
    if (type !== "crossword_basic" || !verticalWord.trim()) return null;
    const drafts = questions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((q) => ({
        question: q.question,
        answer: q.answer,
        order: q.position,
        position: q.position,
      }));
    return validateBasicDraftMessage(verticalWord, drafts);
  }, [type, verticalWord, questions]);

  const advancedGridHint = useMemo(() => {
    if (type !== "crossword_advanced") return null;
    const n = questions.filter((q) => q.question?.trim() && q.answer?.trim()).length;
    if (n < 1) return "Thêm ít nhất một câu để xem kích thước lưới (R×C).";
    const { R, C } = computeRC(n);
    return `Với ${n} câu: lưới gợi ý ảnh ${R}×${C} ô (đủ ${n} ô, phủ kín ảnh). Gợi ý tỉ lệ ảnh 16:9.`;
  }, [type, questions]);

  const basicAnswerFieldErrors = useMemo(() => {
    if (type !== "crossword_basic" || !verticalWord.trim()) {
      return {} as Record<number, string>;
    }
    const drafts = questions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((q) => ({
        question: q.question,
        answer: q.answer,
        order: q.position,
        position: q.position,
      }));
    return getBasicAnswerErrorsByPosition(verticalWord, drafts);
  }, [type, verticalWord, questions]);

  const handleQuestionChange = (
    index: number,
    field: keyof CrosswordQuestion,
    value: string | number
  ) => {
    const newQuestions = [...questions];
    let v: string | number = value;
    if (field === "answer") {
      v = String(value).toUpperCase();
    }
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: v,
    };
    setQuestions(newQuestions);
  };

  const validateForm = () => {
    if (!title) return "Vui lòng nhập tiêu đề";

    if (type === "crossword_basic") {
      if (!verticalWord.trim()) return "Vui lòng nhập từ khóa dọc";
      for (const q of questions) {
        if (!q.question?.trim() || !q.answer?.trim()) {
          return "Vui lòng điền đầy đủ câu hỏi và câu trả lời";
        }
      }
      const drafts = questions
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((q) => ({
          question: q.question,
          answer: q.answer,
          order: q.position,
          position: q.position,
        }));
      const msg = validateBasicDraftMessage(verticalWord, drafts);
      if (msg) return msg;
    }

    if (type === "crossword_advanced") {
      if (!imageUrl.trim()) {
        return "Vui lòng upload ảnh gợi ý (tối thiểu 500 KB) hoặc giữ ảnh hiện tại khi sửa.";
      }
      if (!secretWord.trim()) return "Vui lòng nhập từ khóa bí ẩn";
      for (const q of questions) {
        if (!q.question || !q.answer) {
          return "Vui lòng điền đầy đủ câu hỏi và câu trả lời";
        }
      }
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let finalImageUrl = imageUrl;
      if (type === "crossword_advanced" && pendingImageFile) {
        const fd = new FormData();
        fd.append("file", pendingImageFile);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) {
          const j = (await up.json().catch(() => ({}))) as { message?: string };
          throw new Error(j.message || "Upload ảnh thất bại.");
        }
        const u = (await up.json()) as { url?: string };
        if (!u.url) throw new Error("Upload không trả về URL.");
        finalImageUrl = u.url;
        setImageUrl(u.url);
        setPendingImageFile(null);
      }

      const url = initialData?.id
        ? `/api/quizzes/${initialData.id}`
        : "/api/quizzes";
      const method = initialData?.id ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        title,
        type,
        questions:
          type === "crossword_basic"
            ? questions.map((q, i) => ({
                question: q.question,
                answer: q.answer,
                order: i + 1,
                position: i + 1,
              }))
            : questions.map((q, i) => ({
                question: q.question,
                answer: q.answer,
                order: i + 1,
                position: q.position,
              })),
      };

      if (type === "crossword_basic") {
        body.verticalWord = verticalWord;
      }
      if (type === "crossword_advanced") {
        body.imageUrl = finalImageUrl;
        body.secretWord = secretWord;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { message?: string }).message || "Có lỗi xảy ra khi lưu quiz"
        );
      }

      const saved = await response.json();
      router.push(`/quizzes/${saved.id}`);
      router.refresh();
    } catch (err) {
      console.error("Error saving quiz:", err);
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu quiz"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Tiêu đề Quiz
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      {type === "crossword_advanced" && (
        <div>
          <label htmlFor="secretWord" className="block text-sm font-medium text-gray-700">
            Từ khóa bí ẩn
          </label>
          <input
            id="secretWord"
            type="text"
            value={secretWord}
            onChange={(e) => setSecretWord(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
      )}

      {type === "crossword_basic" && (
        <div>
          <label htmlFor="verticalWord" className="block text-sm font-medium text-gray-700">
            Từ khóa dọc
          </label>
          <input
            id="verticalWord"
            type="text"
            value={verticalWord}
            onChange={(e) => setVerticalWord(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Sau khi chuẩn hóa (bỏ dấu, bỏ khoảng trắng) độ dài là{" "}
            <strong>{normalizeKeyword(verticalWord).length}</strong> ký tự — cần đúng bấy nhiêu câu hỏi,
            mỗi đáp án chứa đúng ký tự tương ứng trên từ khóa (hệ thống tự chọn vị trí chữ trong đáp án).
          </p>
          {basicDraftHint && (
            <p className="mt-2 text-sm text-amber-700">{basicDraftHint}</p>
          )}
        </div>
      )}

      {type === "crossword_advanced" && (
        <div className="space-y-3">
          <div>
            <span className="block text-sm font-medium text-gray-700">
              Ảnh gợi ý từ khóa (bắt buộc, tối thiểu 500 KB)
            </span>
            <input
              ref={advancedFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size < ADVANCED_IMAGE_MIN_BYTES) {
                  setError(advancedImageTooSmallMessage());
                  e.target.value = "";
                  return;
                }
                setError("");
                setPendingImageFile(f);
                setImageUrl("");
              }}
            />
            <button
              type="button"
              onClick={() => advancedFileRef.current?.click()}
              className="mt-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Chọn ảnh từ máy
            </button>
            {pendingImageFile && (
              <p className="mt-1 text-sm text-green-700">
                Đã chọn: {pendingImageFile.name} — sẽ upload khi lưu.
              </p>
            )}
            {imageUrl && !pendingImageFile && (
              <p className="mt-1 text-sm text-gray-600">Ảnh hiện tại: {imageUrl}</p>
            )}
          </div>
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
              Hoặc URL ảnh (dev / đã có CDN)
            </label>
            <input
              id="imageUrl"
              type="url"
              value={pendingImageFile ? "" : imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setPendingImageFile(null);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="https://..."
            />
          </div>
          {(imageUrl || pendingImageFile) && (
            <div className="relative w-full max-w-lg aspect-video rounded-lg border overflow-hidden bg-gray-100">
              <Image
                src={pendingImageFile ? URL.createObjectURL(pendingImageFile) : imageUrl}
                alt="Preview ảnh advanced"
                fill
                className="object-cover"
                unoptimized={Boolean(pendingImageFile)}
              />
            </div>
          )}
          {advancedGridHint && (
            <p className="text-sm text-gray-600 whitespace-pre-line">{advancedGridHint}</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Câu hỏi</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
            >
              {showPreview ? "Ẩn xem trước" : "Xem trước"}
            </button>
            {type !== "crossword_basic" && (
              <button
                type="button"
                onClick={handleAddQuestion}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Thêm câu hỏi
              </button>
            )}
          </div>
        </div>

        {type === "crossword_basic" && showPreview && verticalWord && (
          <div className="mb-6 border rounded-lg">
            <CrosswordPreview questions={questions} verticalWord={verticalWord} />
          </div>
        )}

        <p className="text-sm text-gray-500">
          {type === "crossword_basic"
            ? `Basic: số câu = độ dài từ khóa đã chuẩn hóa (${normalizeKeyword(verticalWord).length} câu khi từ khóa hợp lệ). Mỗi đáp án phải chứa đúng một ký tự của từ khóa (theo thứ tự câu 1 → ký tự 1, …) — bỏ qua dấu và khoảng trắng khi kiểm tra.`
            : "Mỗi câu trả lời đúng mở đúng một ô trên lưới ảnh (số trên ô = thứ tự câu)."}
        </p>

        {questions.map((question, index) => (
          <div key={index} className="border rounded-md p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Câu hỏi {index + 1}</h4>
              {type !== "crossword_basic" && (
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Xóa
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nội dung câu hỏi
              </label>
              <input
                type="text"
                value={question.question}
                onChange={(e) =>
                  handleQuestionChange(index, "question", e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Câu trả lời
              </label>
              <input
                type="text"
                value={question.answer}
                onChange={(e) =>
                  handleQuestionChange(index, "answer", e.target.value)
                }
                aria-invalid={
                  type === "crossword_basic" &&
                  Boolean(basicAnswerFieldErrors[question.position])
                }
                className={`mt-1 block w-full rounded-md border shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  type === "crossword_basic" &&
                  basicAnswerFieldErrors[question.position]
                    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300"
                }`}
                required
              />
              {type === "crossword_basic" &&
                basicAnswerFieldErrors[question.position] && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {basicAnswerFieldErrors[question.position]}
                  </p>
                )}
            </div>

          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Đang lưu..." : initialData ? "Cập nhật Quiz" : "Tạo Quiz"}
        </button>
      </div>
    </form>
  );
}
