"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import CrosswordPreview from "./CrosswordPreview"

interface CrosswordQuestion {
  id?: string
  question: string
  answer: string
  position: number
  letterIndex: number
}

interface CrosswordFormProps {
  gameId: string
  type: "crossword_basic" | "crossword_advanced"
  initialData?: {
    id?: string
    title: string
    verticalWord?: string
    imageUrl?: string
    questions: CrosswordQuestion[]
  }
}

export default function CrosswordForm({ gameId, type, initialData }: CrosswordFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || "")
  const [verticalWord, setVerticalWord] = useState(initialData?.verticalWord || "")
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "")
  const [questions, setQuestions] = useState<CrosswordQuestion[]>(
    initialData?.questions || [createEmptyQuestion(1)]
  )
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  function createEmptyQuestion(position: number): CrosswordQuestion {
    return {
      question: "",
      answer: "",
      position,
      letterIndex: 1,
    }
  }

  const handleAddQuestion = () => {
    setQuestions([...questions, createEmptyQuestion(questions.length + 1)])
  }

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      setError("Quiz phải có ít nhất 1 câu hỏi")
      return
    }
    const newQuestions = questions.filter((_, i) => i !== index)
    // Cập nhật lại position cho các câu hỏi
    newQuestions.forEach((q, i) => {
      q.position = i + 1
    })
    setQuestions(newQuestions)
  }

  // Validate vertical word when questions change
  useEffect(() => {
    if (type === "crossword_basic" && verticalWord) {
      const secretWord = questions
        .sort((a, b) => a.position - b.position)
        .map(q => q.answer[q.letterIndex - 1] || "")
        .join("")
        .toUpperCase()
      
      if (secretWord && secretWord !== verticalWord.toUpperCase()) {
        setError(`Chữ cái được chọn từ các câu trả lời không tạo thành từ khóa "${verticalWord}"`)
      } else {
        setError("")
      }
    }
  }, [questions, verticalWord, type])

  const handleQuestionChange = (index: number, field: keyof CrosswordQuestion, value: string | number) => {
    const newQuestions = [...questions]
    if (field === "answer") {
      value = String(value).toUpperCase()
    }
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    }
    setQuestions(newQuestions)
  }

  const validateForm = () => {
    if (!title) return "Vui lòng nhập tiêu đề"
    
    if (type === "crossword_basic") {
      if (!verticalWord) return "Vui lòng nhập từ khóa dọc"
      
      if (questions.length < verticalWord.length) {
        return `Cần ít nhất ${verticalWord.length} câu hỏi để tạo từ khóa "${verticalWord}"`
      }

      // Validate all questions have content
      for (const q of questions) {
        if (!q.question || !q.answer) {
          return "Vui lòng điền đầy đủ câu hỏi và câu trả lời"
        }
        if (q.letterIndex - 1 >= q.answer.length) {
          return `Vị trí chữ cái (${q.letterIndex}) vượt quá độ dài của câu trả lời "${q.answer}"`
        }
      }

      // Validate vertical word matches selected letters
      const secretWord = questions
        .sort((a, b) => a.position - b.position)
        .map(q => q.answer[q.letterIndex - 1] || "")
        .join("")
        .toUpperCase()
      
      if (secretWord !== verticalWord.toUpperCase()) {
        return `Chữ cái được chọn từ các câu trả lời phải tạo thành từ khóa "${verticalWord}"`
      }
    }
    
    if (type === "crossword_advanced" && !imageUrl) {
      return "Vui lòng nhập URL hình ảnh"
    }

    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch(
        `/api/games/${gameId}/quizzes${initialData?.id ? `/${initialData.id}` : ""}`,
        {
          method: initialData?.id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            verticalWord: type === "crossword_basic" ? verticalWord : undefined,
            imageUrl: type === "crossword_advanced" ? imageUrl : undefined,
            questions: questions.map(q => ({
              question: q.question,
              answer: q.answer,
              position: q.position,
              letterIndex: q.letterIndex,
            })),
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Có lỗi xảy ra khi lưu quiz")
      }

      router.push(`/games/${gameId}`)
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
          Tiêu đề Quiz
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      {type === "crossword_basic" && (
        <div>
          <label htmlFor="verticalWord" className="block text-sm font-medium text-gray-700">
            Từ khóa dọc
          </label>
          <input
            type="text"
            id="verticalWord"
            value={verticalWord}
            onChange={(e) => setVerticalWord(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Đây là từ sẽ được tạo thành từ các chữ cái được chọn trong mỗi câu trả lời.
          </p>
        </div>
      )}

      {type === "crossword_advanced" && (
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
            URL Hình ảnh
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Hình ảnh này sẽ được hiện ra dần dần khi người chơi trả lời đúng.
          </p>
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
            <button
              type="button"
              onClick={handleAddQuestion}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Thêm câu hỏi
            </button>
          </div>
        </div>

        {type === "crossword_basic" && showPreview && verticalWord && (
          <div className="mb-6 border rounded-lg">
            <CrosswordPreview
              questions={questions}
              verticalWord={verticalWord}
            />
          </div>
        )}

        <p className="text-sm text-gray-500">
          {type === "crossword_basic"
            ? `Mỗi câu trả lời sẽ đóng góp một chữ cái vào từ khóa dọc "${verticalWord || ''}". Cần ít nhất ${verticalWord?.length || 0} câu hỏi.`
            : "Mỗi câu trả lời đúng sẽ mở khóa một phần của hình ảnh."}
        </p>

        {questions.map((question, index) => (
          <div key={index} className="border rounded-md p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Câu hỏi {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleRemoveQuestion(index)}
                className="text-red-600 hover:text-red-800"
              >
                Xóa
              </button>
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
              <label className="block text-sm font-medium text-gray-700">
                Câu trả lời
              </label>
              <input
                type="text"
                value={question.answer}
                onChange={(e) => handleQuestionChange(index, "answer", e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            {type === "crossword_basic" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vị trí chữ cái đóng góp vào từ khóa (bắt đầu từ 1)
                </label>
                <input
                  type="number"
                  min="1"
                  value={question.letterIndex}
                  onChange={(e) => handleQuestionChange(index, "letterIndex", parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Chữ cái thứ mấy trong câu trả lời sẽ đóng góp vào từ khóa dọc (1 là chữ cái đầu tiên)
                </p>
              </div>
            )}
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
  )
} 