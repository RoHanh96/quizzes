"use client"

import { useState, useEffect } from "react"
import { CrosswordQuestion } from "@prisma/client"
import Image from "next/image"
import { Quiz } from "@/types"

interface CrosswordGameProps {
  quiz: Quiz & {
    crosswordQuestions: CrosswordQuestion[]
  }
}

export default function CrosswordGame({ quiz }: CrosswordGameProps) {
  // Sort questions by order
  const sortedQuestions = [...quiz.crosswordQuestions].sort((a, b) => a.order - b.order)

  // State for game progress
  const [gameState, setGameState] = useState<{
    [key: string]: {
      isAnswered: boolean
      isActive: boolean
      userAnswer: string
      showError: boolean
    }
  }>(
    Object.fromEntries(
      quiz.crosswordQuestions.map(q => [
        q.id,
        { isAnswered: false, isActive: false, userAnswer: "", showError: false }
      ])
    )
  )

  // State for selected question and secret word
  const [selectedQuestion, setSelectedQuestion] = useState<CrosswordQuestion | null>(null)
  const [allCorrect, setAllCorrect] = useState(false)
  const [revealedParts, setRevealedParts] = useState<boolean[]>(
    Array(quiz.crosswordQuestions.length).fill(false)
  )
  const [secretWordGuess, setSecretWordGuess] = useState("")
  const [showSecretWordForm, setShowSecretWordForm] = useState(false)
  const [isSecretWordFound, setIsSecretWordFound] = useState(false)
  const [secretWordError, setSecretWordError] = useState(false)

  useEffect(() => {
    // Check if all answers are correct
    if (quiz.type === "crossword_advanced") {
      const isAllCorrect = Object.values(gameState).every(state => state.isAnswered)
      setAllCorrect(isAllCorrect)
    }
  }, [gameState, quiz.type])

  // Add useEffect for logging
  useEffect(() => {
    if (quiz.type === "crossword_advanced") {
      console.log('Debug info:', {
        revealedParts,
        numberOfRevealedParts: revealedParts.filter(Boolean).length,
        totalQuestions: quiz.crosswordQuestions.length,
        revealPercentage: (revealedParts.filter(Boolean).length / quiz.crosswordQuestions.length * 100),
        sortedQuestions: sortedQuestions.map(q => ({
          id: q.id,
          order: q.order,
          isAnswered: gameState[q.id].isAnswered
        }))
      })
    }
  }, [revealedParts, quiz.type, quiz.crosswordQuestions.length, gameState, sortedQuestions])

  const handleQuestionClick = (question: CrosswordQuestion) => {
    if (gameState[question.id].isAnswered) return

    // Close current question if clicked again
    if (selectedQuestion?.id === question.id) {
      setSelectedQuestion(null)
      setGameState(prev => ({
        ...prev,
        [question.id]: { ...prev[question.id], isActive: false }
      }))
      return
    }

    // Close previous question if exists
    if (selectedQuestion) {
      setGameState(prev => ({
        ...prev,
        [selectedQuestion.id]: { ...prev[selectedQuestion.id], isActive: false }
      }))
    }

    // Open new question
    setSelectedQuestion(question)
    setGameState(prev => ({
      ...prev,
      [question.id]: { ...prev[question.id], isActive: true, showError: false }
    }))
  }

  // Calculate revealed width percentage
  const getRevealedWidth = () => {
    const answeredCount = revealedParts.filter(Boolean).length
    console.log('Debug getRevealedWidth:', {
      revealedParts,
      answeredCount,
      totalQuestions: quiz.crosswordQuestions.length,
      width: answeredCount > 0 ? (answeredCount * (100 / quiz.crosswordQuestions.length)) : 0
    })
    return answeredCount > 0 ? (answeredCount * (100 / quiz.crosswordQuestions.length)) : 0
  }

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuestion) return

    const isCorrect = gameState[selectedQuestion.id].userAnswer.toLowerCase().trim() === 
                     selectedQuestion.answer.toLowerCase().trim()

    console.log('Debug handleAnswerSubmit:', {
      questionId: selectedQuestion.id,
      isCorrect,
      currentRevealedParts: [...revealedParts]
    })

    if (isCorrect) {
      // Update game state
      setGameState(prev => ({
        ...prev,
        [selectedQuestion.id]: {
          ...prev[selectedQuestion.id],
          isAnswered: true,
          isActive: false,
          showError: false
        }
      }))

      // Update revealed parts for advanced crossword
      if (quiz.type === "crossword_advanced") {
        const index = sortedQuestions.findIndex(q => q.id === selectedQuestion.id)
        console.log('Debug correct answer:', {
          index,
          questionId: selectedQuestion.id,
          sortedQuestions: sortedQuestions.map(q => ({ id: q.id }))
        })
        
        if (index !== -1) {
          setRevealedParts(prev => {
            const newParts = [...prev]
            newParts[index] = true
            console.log('Debug setting new revealed parts:', {
              oldParts: [...prev],
              newParts,
              index
            })
            return newParts
          })
        }
      }

      // Clear selected question
      setSelectedQuestion(null)
    } else {
      // Show error message
      setGameState(prev => ({
        ...prev,
        [selectedQuestion.id]: {
          ...prev[selectedQuestion.id],
          showError: true
        }
      }))
    }
  }

  // Add effect to monitor revealedParts changes
  useEffect(() => {
    if (quiz.type === "crossword_advanced") {
      console.log('Debug revealedParts changed:', {
        revealedParts,
        answeredCount: revealedParts.filter(Boolean).length,
        questions: sortedQuestions.map(q => ({
          id: q.id,
          isAnswered: gameState[q.id].isAnswered
        }))
      })
    }
  }, [revealedParts, quiz.type, sortedQuestions, gameState])

  const handleSecretWordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quiz.secretWord) return

    const isCorrect = secretWordGuess.toLowerCase().trim() === quiz.secretWord.toLowerCase().trim()
    if (isCorrect) {
      setIsSecretWordFound(true)
      setShowSecretWordForm(false)
      setSecretWordError(false)
    } else {
      setSecretWordError(true)
    }
  }

  return (
    <div className="space-y-8">
      {quiz.type === "crossword_advanced" && quiz.imageUrl && (
        <>
          <div className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            {allCorrect ? (
              <Image
                src={quiz.imageUrl || ""}
                alt={quiz.title}
                fill
                className="object-contain"
              />
            ) : (
              <div className="relative h-full w-full overflow-hidden">
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{
                    clipPath: `inset(0 ${100 - getRevealedWidth()}% 0 0)`,
                    transition: "clip-path 0.3s ease-in-out",
                  }}
                >
                  <Image
                    src={quiz.imageUrl || ""}
                    alt={quiz.title}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>
            )}
          </div>

          {/* Secret word section */}
          {quiz.type === "crossword_advanced" && quiz.secretWord && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Từ khóa bí ẩn:</h3>
                {!isSecretWordFound && !showSecretWordForm && (
                  <button
                    onClick={() => {
                      setShowSecretWordForm(true)
                      setSecretWordError(false)
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Đoán từ khóa
                  </button>
                )}
              </div>

              {showSecretWordForm ? (
                <form onSubmit={handleSecretWordSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={secretWordGuess}
                      onChange={(e) => {
                        setSecretWordGuess(e.target.value)
                        setSecretWordError(false)
                      }}
                      className={`flex-1 border rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none
                        ${secretWordError ? "border-red-500" : ""}`}
                      placeholder="Nhập từ khóa bí ẩn..."
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
                      onClick={() => {
                        setShowSecretWordForm(false)
                        setSecretWordError(false)
                      }}
                      className="border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                  {secretWordError && (
                    <p className="text-red-500 text-sm">
                      Từ khóa không chính xác, vui lòng thử lại!
                    </p>
                  )}
                </form>
              ) : (
                <div className="flex justify-center space-x-2">
                  {Array.from(quiz.secretWord).map((letter, index) => (
                    <div
                      key={index}
                      className={`w-10 h-10 border-2 flex items-center justify-center font-bold text-xl
                        ${isSecretWordFound 
                          ? "border-green-500 bg-green-50 text-green-700" 
                          : "border-indigo-500"}`}
                    >
                      {isSecretWordFound ? letter : "?"}
                    </div>
                  ))}
                </div>
              )}

              {isSecretWordFound && (
                <div className="mt-4 text-center text-green-600">
                  <p>Chúc mừng! Bạn đã tìm ra từ khóa bí ẩn!</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-6">
          {sortedQuestions.map((question) => {
            const state = gameState[question.id]
            const answer = question.answer.toUpperCase()

            return (
              <div key={question.id}>
                {/* Horizontal word display */}
                <div 
                  className={`cursor-pointer transition-colors duration-200
                    ${state.isAnswered ? "text-green-600" : "hover:bg-gray-50"}
                    ${state.isActive ? "bg-indigo-50" : ""}`}
                  onClick={() => !state.isAnswered && handleQuestionClick(question)}
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-medium min-w-[4rem]">Câu {question.order}:</span>
                    <div className="flex space-x-1">
                      {answer.split("").map((letter, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 border-2 flex items-center justify-center font-medium
                            transition-all duration-200 ease-in-out
                            ${state.isAnswered
                              ? "border-green-500 bg-green-50"
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

                {/* Question and answer form when active */}
                {state.isActive && (
                  <div className="mt-3 ml-[4rem] pl-4 border-l-2 border-indigo-200">
                    <p className="mb-2 text-gray-600">{question.question}</p>
                    <form onSubmit={handleAnswerSubmit} className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={state.userAnswer}
                          onChange={(e) => setGameState(prev => ({
                            ...prev,
                            [question.id]: { ...prev[question.id], userAnswer: e.target.value }
                          }))}
                          className={`flex-1 border rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none
                            ${state.showError ? "border-red-500" : ""}`}
                          placeholder="Nhập câu trả lời..."
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 transition-colors"
                        >
                          Trả lời
                        </button>
                      </div>
                      {state.showError && (
                        <p className="text-red-500 text-sm">
                          Đáp án không chính xác, vui lòng thử lại!
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 