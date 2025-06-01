"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Quiz, CrosswordQuestion } from "@prisma/client"

interface CrosswordFormProps {
  initialData?: Quiz & {
    crosswordQuestions: CrosswordQuestion[]
  }
}

type QuestionInput = Omit<CrosswordQuestion, "id" | "quizId" | "createdAt" | "updatedAt">

export default function CrosswordForm({ initialData }: CrosswordFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || "")
  const [verticalWord, setVerticalWord] = useState(initialData?.verticalWord || "")
  const [questions, setQuestions] = useState<QuestionInput[]>(
    initialData?.crosswordQuestions.map(q => ({
      question: q.question,
      answer: q.answer,
      order: q.order,
    })) || [{ question: "", answer: "", order: 1 }]
  )
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        answer: "",
        order: questions.length + 1,
      },
    ])
  }

  const handleQuestionChange = (index: number, field: "question" | "answer", value: string) => {
    const newQuestions = [...questions]
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    }
    setQuestions(newQuestions)
  }

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index)
      // Update order for remaining questions
      newQuestions.forEach((q, i) => {
        q.order = i + 1
      })
      setQuestions(newQuestions)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const url = initialData
        ? `/api/quizzes/${initialData.id}`
        : "/api/quizzes"
      const method = initialData ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          verticalWord,
          questions: questions.map((q, index) => ({
            ...q,
            order: index + 1,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save quiz")
      }

      const data = await response.json()
      router.push(`/quizzes/${data.id}`)
    } catch (err) {
      setError("Có lỗi xảy ra khi lưu quiz. Vui lòng thử lại.")
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

      <div>
        <label htmlFor="verticalWord" className="block text-sm font-medium text-gray-700">
          Từ khóa (Từ đọc dọc)
        </label>
        <input
          type="text"
          id="verticalWord"
          value={verticalWord}
          onChange={(e) => setVerticalWord(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
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

        {questions.map((question, index) => (
          <div key={index} className="border rounded-md p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Câu hỏi #{index + 1}</h4>
              {questions.length > 1 && (
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
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Đang lưu..." : initialData ? "Cập nhật" : "Tạo Quiz"}
        </button>
      </div>
    </form>
  )
} 