"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

interface CrosswordQuestion {
  id: string
  question: string
  answer: string
  position: number
  letterIndex: number
}

interface CrosswordGameProps {
  title: string
  verticalWord?: string
  imageUrl?: string
  questions: CrosswordQuestion[]
  gameId: string
  type: "crossword_basic" | "crossword_advanced"
}

export default function CrosswordGame({ title, verticalWord, imageUrl, questions, gameId, type }: CrosswordGameProps) {
  // Sắp xếp câu hỏi theo position
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position)
  
  // State để lưu trạng thái của từng câu hỏi
  const [gameState, setGameState] = useState<{
    [key: string]: {
      isAnswered: boolean
      isActive: boolean
      userAnswer: string
    }
  }>(
    Object.fromEntries(
      questions.map(q => [
        q.id,
        { isAnswered: false, isActive: false, userAnswer: "" }
      ])
    )
  )

  // State cho từ khóa bí mật
  const [secretWordGuess, setSecretWordGuess] = useState("")
  const [isSecretWordFound, setIsSecretWordFound] = useState(false)
  const [showSecretWordForm, setShowSecretWordForm] = useState(false)

  // State để lưu câu hỏi đang được chọn
  const [selectedQuestion, setSelectedQuestion] = useState<CrosswordQuestion | null>(null)

  const handleQuestionClick = (question: CrosswordQuestion) => {
    if (gameState[question.id].isAnswered) return

    // Đóng câu hỏi đang mở nếu click lại
    if (selectedQuestion?.id === question.id) {
      setSelectedQuestion(null)
      setGameState(prev => ({
        ...prev,
        [question.id]: { ...prev[question.id], isActive: false }
      }))
      return
    }

    // Đóng câu hỏi cũ nếu có
    if (selectedQuestion) {
      setGameState(prev => ({
        ...prev,
        [selectedQuestion.id]: { ...prev[selectedQuestion.id], isActive: false }
      }))
    }

    // Mở câu hỏi mới
    setSelectedQuestion(question)
    setGameState(prev => ({
      ...prev,
      [question.id]: { ...prev[question.id], isActive: true }
    }))
  }

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuestion) return

    const questionId = selectedQuestion.id
    const userAnswer = gameState[questionId].userAnswer.toUpperCase()
    const isCorrect = userAnswer === selectedQuestion.answer.toUpperCase()

    if (isCorrect) {
      // Hiệu ứng và thông báo khi trả lời đúng
      toast.success("Chính xác! 🎉")
      
      setGameState(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          isAnswered: true,
          isActive: false,
        }
      }))
      setSelectedQuestion(null)
    } else {
      toast.error("Đáp án chưa chính xác, hãy thử lại!")
    }
  }

  const handleSecretWordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const guess = secretWordGuess.toUpperCase()
    
    if (guess === verticalWord?.toUpperCase()) {
      setIsSecretWordFound(true)
      setShowSecretWordForm(false)
      toast.success("🎉 Chúc mừng! Bạn đã tìm ra từ khóa bí mật!", {
        duration: 5000
      })
    } else {
      toast.error("Từ khóa chưa chính xác, hãy thử lại!")
    }
  }

  // Kiểm tra xem đã hoàn thành game chưa
  const isGameCompleted = Object.values(gameState).every(q => q.isAnswered)

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header với nút back */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/games/${gameId}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Quay lại</span>
        </Link>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {/* Hiển thị từ khóa */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Từ khóa cần tìm:</h3>
          {!isSecretWordFound && !showSecretWordForm && (
            <button
              onClick={() => setShowSecretWordForm(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Đoán từ khóa
            </button>
          )}
        </div>

        {showSecretWordForm ? (
          <form onSubmit={handleSecretWordSubmit} className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={secretWordGuess}
                onChange={(e) => setSecretWordGuess(e.target.value)}
                className="flex-1 border rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                placeholder="Nhập từ khóa bí mật..."
                autoFocus
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 transition-colors"
              >
                Kiểm tra
              </button>
              <button
                type="button"
                onClick={() => setShowSecretWordForm(false)}
                className="border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-center space-x-2">
            {verticalWord?.split("").map((letter, index) => (
              <div
                key={index}
                className={`w-10 h-10 border-2 flex items-center justify-center font-bold text-xl
                  ${isSecretWordFound 
                    ? "border-green-500 bg-green-50 text-green-700" 
                    : "border-indigo-500"}`}
              >
                {isSecretWordFound || isGameCompleted ? letter : "?"}
              </div>
            ))}
          </div>
        )}

        {isSecretWordFound && !isGameCompleted && (
          <div className="mt-4 text-center text-green-600">
            <p>Bạn đã tìm ra từ khóa bí mật! Hãy tiếp tục giải các câu đố còn lại.</p>
          </div>
        )}
      </div>

      {/* Khung chứa tất cả câu hỏi */}
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="space-y-6">
          {sortedQuestions.map((question) => {
            const state = gameState[question.id]
            const answer = question.answer.toUpperCase()

            return (
              <div key={question.id}>
                {/* Hiển thị câu trả lời hoặc ô trống */}
                <div 
                  className={`cursor-pointer transition-colors duration-200
                    ${state.isAnswered ? "text-green-600" : "hover:bg-gray-50"}
                    ${state.isActive ? "bg-indigo-50" : ""}`}
                  onClick={() => !state.isAnswered && handleQuestionClick(question)}
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-medium min-w-[4rem]">Câu {question.position}:</span>
                    <div className="flex space-x-1">
                      {answer.split("").map((letter, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 border-2 flex items-center justify-center font-medium
                            transition-all duration-200 ease-in-out
                            ${state.isAnswered
                              ? i === question.letterIndex - 1
                                ? "border-indigo-500 bg-indigo-50 text-indigo-600 scale-110"
                                : "border-green-500 bg-green-50"
                              : state.isActive
                                ? "border-indigo-200 bg-indigo-50/30"
                                : "border-gray-300"
                            }`}
                        >
                          {state.isAnswered ? letter : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form trả lời khi câu hỏi được chọn */}
                {state.isActive && (
                  <div className="mt-3 ml-[4rem] pl-4 border-l-2 border-indigo-200">
                    <p className="mb-2 text-gray-600">{question.question}</p>
                    <form onSubmit={handleAnswerSubmit} className="flex space-x-2">
                      <input
                        type="text"
                        value={state.userAnswer}
                        onChange={(e) => setGameState(prev => ({
                          ...prev,
                          [question.id]: { ...prev[question.id], userAnswer: e.target.value }
                        }))}
                        className="flex-1 border rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                        placeholder="Nhập câu trả lời..."
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 transition-colors"
                      >
                        Trả lời
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Thông báo hoàn thành */}
      {isGameCompleted && (
        <div className="mt-8">
          <div className="bg-green-50 text-green-600 p-6 rounded-lg text-center border border-green-200">
            <h3 className="text-xl font-medium">🎉 Chúc mừng!</h3>
            <p className="mt-2">Bạn đã hoàn thành thành công tất cả các câu hỏi.</p>
            <p className="font-medium mt-4 text-lg">
              Từ khóa bí mật là: <span className="text-green-700">{verticalWord}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 