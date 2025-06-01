"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface Question {
  question: string
  answer: string
  order?: number
  options?: string[] // for multiple choice
  correctOption?: number // for multiple choice
}

interface QuizFormProps {
  initialData?: any // We'll type this properly later
}

export default function QuizForm({ initialData }: QuizFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    type: initialData?.type || "multiple_choice",
    verticalWord: initialData?.verticalWord || "",
    secretWord: initialData?.secretWord || "",
    imageUrl: initialData?.imageUrl || "",
    imageFile: null as File | null,
    questions: initialData?.questions || [{ question: "", answer: "", order: 1 }]
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(initialData?.imageUrl || "")

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: "",
          answer: "",
          order: formData.questions.length + 1
        }
      ]
    })
  }

  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    }
    setFormData({
      ...formData,
      questions: newQuestions
    })
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
      let finalImageUrl = formData.imageUrl

      // Nếu có file hình ảnh, upload lên server trước
      if (formData.imageFile) {
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
      const quizData = {
        ...formData,
        imageUrl: finalImageUrl,
        imageFile: undefined, // Không gửi file trong JSON
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
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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