"use client"

import { useState, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { normalizeKeyword } from "@/modules/quiz/lib/text"
import {
  validateBasicDraftMessage,
  getBasicAnswerErrorsByPosition,
} from "@/modules/quiz/validation/crossword-basic"
import {
  ADVANCED_IMAGE_MIN_BYTES,
  advancedImageTooSmallMessage,
} from "@/modules/quiz/validation/crossword-advanced"

interface Question {
  question: string
  answer?: string
  order?: number
  options?: string[]
  correctOption?: number
  difficulty?: string
}

function defaultMcQuestion(order = 1): Question {
  return {
    question: "",
    options: ["", "", "", ""],
    correctOption: 0,
    difficulty: "easy",
    order,
  }
}

function defaultCrosswordQuestion(order = 1): Question {
  return { question: "", answer: "", order }
}

interface QuizFormProps {
  initialData?: any // We'll type this properly later
}

export default function QuizForm({ initialData }: QuizFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialType = initialData?.type || "multiple_choice"
  const initialQuestions: Question[] =
    initialData?.questions && Array.isArray(initialData.questions)
      ? initialData.questions
      : initialType === "multiple_choice"
        ? [defaultMcQuestion(1)]
        : [defaultCrosswordQuestion(1)]
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    type: initialType,
    verticalWord: initialData?.verticalWord || "",
    secretWord: initialData?.secretWord || "",
    imageUrl: initialData?.imageUrl || "",
    imageFile: null as File | null,
    playLength:
      typeof initialData?.playLength === "number" ? initialData.playLength : 1,
    questions: initialQuestions,
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(initialData?.imageUrl || "")

  const basicAnswerFieldErrors = useMemo(() => {
    if (formData.type !== "crossword_basic" || !formData.verticalWord.trim()) {
      return {} as Record<number, string>
    }
    const drafts = formData.questions.map((q: Question, i: number) => ({
      question: q.question,
      answer: String(q.answer ?? "").trim(),
      order: i + 1,
      position: i + 1,
    }))
    return getBasicAnswerErrorsByPosition(formData.verticalWord, drafts)
  }, [formData.type, formData.verticalWord, formData.questions])

  const handleAddQuestion = () => {
    const nextOrder = formData.questions.length + 1
    const blank: Question =
      formData.type === "multiple_choice"
        ? defaultMcQuestion(nextOrder)
        : defaultCrosswordQuestion(nextOrder)
    setFormData({
      ...formData,
      questions: [...formData.questions, blank],
    })
  }

  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    }
    setFormData({
      ...formData,
      questions: newQuestions,
    })
  }

  const handleMcOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...formData.questions]
    const prev = newQuestions[qIndex]!
    const opts = [...(prev.options || ["", "", "", ""])]
    opts[optIndex] = value
    newQuestions[qIndex] = { ...prev, options: opts }
    setFormData({ ...formData, questions: newQuestions })
  }

  const handleMcNumberChange = (
    index: number,
    field: "correctOption" | "difficulty",
    value: number | string
  ) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = {
      ...newQuestions[index]!,
      [field]: value,
    }
    setFormData({ ...formData, questions: newQuestions })
  }

  const handleRemoveQuestion = (index: number) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_: Question, i: number) => i !== index)
      // Cập nhật lại order cho các câu hỏi
      newQuestions.forEach((q: Question, i: number) => {
        q.order = i + 1
      })
      setFormData({
        ...formData,
        questions: newQuestions
      })
    }
  }

  // Xử lý khi URL hình ảnh thay đổi
  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url, imageFile: null }))
    setPreviewUrl(url)
  }

  // Xử lý khi chọn file từ local
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file, imageUrl: "" }))
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
    }
  }

  // Xử lý khi click nút upload
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      if (formData.type === "crossword_basic") {
        const drafts = formData.questions.map((q: Question, i: number) => ({
          question: String(q.question || "").trim(),
          answer: String(q.answer || "").trim(),
          order: i + 1,
          position: i + 1,
        }))
        const err = validateBasicDraftMessage(formData.verticalWord, drafts)
        if (err) {
          setError(err)
          setIsSubmitting(false)
          return
        }
        const N = normalizeKeyword(formData.verticalWord).length
        if (N > 0 && drafts.length !== N) {
          setError(
            `Crossword basic: cần đúng ${N} câu hỏi (theo từ khóa đã chuẩn hóa), hiện có ${drafts.length} câu.`
          )
          setIsSubmitting(false)
          return
        }
      }

      let finalImageUrl = formData.imageUrl

      // Nếu có file hình ảnh, upload lên server trước
      if (formData.imageFile) {
        if (
          formData.type === "crossword_advanced" &&
          formData.imageFile.size < ADVANCED_IMAGE_MIN_BYTES
        ) {
          setError(advancedImageTooSmallMessage())
          setIsSubmitting(false)
          return
        }
        const formDataUpload = new FormData()
        formDataUpload.append("file", formData.imageFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        })

        if (!uploadResponse.ok) {
          throw new Error("Có lỗi xảy ra khi upload hình ảnh")
        }

        const uploadData = await uploadResponse.json()
        finalImageUrl = uploadData.url
      }

      // Chuẩn bị dữ liệu để gửi
      const quizData: Record<string, unknown> = {
        ...formData,
        imageUrl: finalImageUrl,
        imageFile: undefined, // Không gửi file trong JSON
      }

      if (formData.type === "crossword_basic") {
        quizData.questions = formData.questions.map((q: Question, i: number) => ({
          question: q.question,
          answer: q.answer,
          order: i + 1,
          position: i + 1,
        }))
      }

      if (formData.type === "multiple_choice") {
        quizData.playLength = formData.playLength
        quizData.questions = formData.questions.map((q: Question, i: number) => ({
          question: String(q.question || "").trim(),
          options: (q.options || ["", "", "", ""]).map((x) => String(x || "").trim()),
          answer: q.correctOption ?? 0,
          difficulty: q.difficulty || "easy",
          order: i + 1,
        }))
      }

      // Gửi dữ liệu quiz với URL hình ảnh đã được upload (nếu có)
      const response = await fetch(`/api/quizzes${initialData?.id ? `/${initialData.id}` : ""}`, {
        method: initialData?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Có lỗi xảy ra khi lưu quiz")
      }

      router.push("/quizzes")
      router.refresh()
    } catch (error) {
      console.error("Error saving quiz:", error)
      setError(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu quiz")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Tiêu đề
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Loại Quiz
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => {
            const t = e.target.value
            setFormData({
              ...formData,
              type: t,
              questions:
                t === "multiple_choice"
                  ? [defaultMcQuestion(1)]
                  : [defaultCrosswordQuestion(1)],
              playLength: t === "multiple_choice" ? 1 : formData.playLength,
            })
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={!!initialData}
        >
          <option value="multiple_choice">Multiple Choice Quiz</option>
          <option value="crossword_basic">Crossword Puzzle - Basic (Vertical Word)</option>
          <option value="crossword_advanced">Crossword Puzzle - Advanced (Image Reveal)</option>
        </select>
      </div>

      {formData.type === "crossword_basic" && (
        <>
          <div>
            <label htmlFor="verticalWord" className="block text-sm font-medium text-gray-700">
              Từ khóa dọc
            </label>
            <input
              type="text"
              id="verticalWord"
              value={formData.verticalWord}
              onChange={(e) => setFormData({ ...formData, verticalWord: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Cần đúng {normalizeKeyword(formData.verticalWord).length || "—"} câu (theo từ khóa đã chuẩn hóa).
              Mỗi đáp án phải chứa ký tự tương ứng trên từ khóa (câu 1 → ký tự 1, …).
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Câu hỏi</h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-indigo-600 hover:text-indigo-800"
              >
                + Thêm câu hỏi
              </button>
            </div>

            {formData.questions.map((question: Question, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Câu hỏi #{index + 1}</span>
                  {formData.questions.length > 1 && (
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
                    Câu hỏi
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Đáp án
                  </label>
                  <input
                    type="text"
                    value={question.answer}
                    onChange={(e) => handleQuestionChange(index, "answer", e.target.value)}
                    aria-invalid={Boolean(basicAnswerFieldErrors[index + 1])}
                    className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                      basicAnswerFieldErrors[index + 1]
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {basicAnswerFieldErrors[index + 1] && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {basicAnswerFieldErrors[index + 1]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {formData.type === "crossword_advanced" && (
        <>
          <div>
            <label htmlFor="secretWord" className="block text-sm font-medium text-gray-700">
              Từ khóa bí ẩn
            </label>
            <input
              type="text"
              id="secretWord"
              value={formData.secretWord}
              onChange={(e) => setFormData({ ...formData, secretWord: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Đây là từ khóa mà người chơi cần đoán dựa trên hình ảnh được hiện ra
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Hình ảnh</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* URL Input */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                  URL Hình ảnh
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload từ máy tính
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Chọn file hình ảnh
                </button>
              </div>
            </div>

            {/* Image Preview */}
            {previewUrl && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <div className="relative w-full h-64 border rounded-lg overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                    onError={() => setPreviewUrl("")}
                  />
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Hình ảnh sẽ được hiện dần khi người chơi trả lời đúng các câu hỏi
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Câu hỏi</h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-indigo-600 hover:text-indigo-800"
              >
                + Thêm câu hỏi
              </button>
            </div>

            {formData.questions.map((question: Question, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Câu hỏi #{index + 1}</span>
                  {formData.questions.length > 1 && (
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
                    Câu hỏi
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Đáp án
                  </label>
                  <input
                    type="text"
                    value={question.answer}
                    onChange={(e) => handleQuestionChange(index, "answer", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Mỗi khi người chơi trả lời đúng một câu hỏi, một phần của hình ảnh sẽ được hiện ra
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {formData.type === "multiple_choice" && (
        <>
          <div>
            <label htmlFor="playLength" className="block text-sm font-medium text-gray-700">
              Số câu trong một lần chơi (≤ số câu trong ngân hàng)
            </label>
            <input
              type="number"
              id="playLength"
              min={1}
              max={formData.questions.length || 1}
              value={formData.playLength}
              onChange={(e) => {
                const n = Math.max(1, parseInt(e.target.value, 10) || 1)
                const cap = Math.max(1, formData.questions.length)
                setFormData({ ...formData, playLength: Math.min(n, cap) })
              }}
              className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Ngân hàng hiện có {formData.questions.length} câu.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Ngân hàng câu hỏi</h3>

            {formData.questions.map((question: Question, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Câu hỏi #{index + 1}</span>
                  {formData.questions.length > 1 && (
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
                    onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Bốn phương án (A–D)
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(["A", "B", "C", "D"] as const).map((lab, oi) => (
                      <div key={lab}>
                        <label className="text-xs text-gray-600">{lab}</label>
                        <input
                          type="text"
                          value={(question.options || ["", "", "", ""])[oi] || ""}
                          onChange={(e) => handleMcOptionChange(index, oi, e.target.value)}
                          className="mt-0.5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Đáp án đúng
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {([0, 1, 2, 3] as const).map((ci) => (
                      <label key={ci} className="inline-flex items-center gap-1 text-sm">
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={(question.correctOption ?? 0) === ci}
                          onChange={() => handleMcNumberChange(index, "correctOption", ci)}
                        />
                        {["A", "B", "C", "D"][ci]}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Độ khó
                  </label>
                  <select
                    value={question.difficulty || "easy"}
                    onChange={(e) =>
                      handleMcNumberChange(index, "difficulty", e.target.value)
                    }
                    className="mt-1 block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                    <option value="extreme">Siêu khó</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    data-testid="mc-add-question-after-card"
                  >
                    + Thêm câu hỏi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isSubmitting ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isSubmitting ? "Đang lưu..." : initialData ? "Cập nhật Quiz" : "Tạo Quiz"}
      </button>
    </form>
  )
} 