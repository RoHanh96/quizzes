"use client"

interface CrosswordQuestion {
  question: string
  answer: string
  position: number
  letterIndex: number
}

interface CrosswordPreviewProps {
  questions: CrosswordQuestion[]
  verticalWord: string
}

export default function CrosswordPreview({ questions, verticalWord }: CrosswordPreviewProps) {
  // Sắp xếp câu hỏi theo position
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position)

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Từ khóa: {verticalWord}</h3>
        <div className="flex justify-center space-x-2">
          {verticalWord.split("").map((letter, index) => (
            <div
              key={index}
              className="w-8 h-8 border-2 border-indigo-500 flex items-center justify-center font-bold text-indigo-600"
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {sortedQuestions.map((question, index) => {
          // Tính toán vị trí của chữ cái đóng góp vào từ khóa
          const letterPosition = question.letterIndex - 1 // Chuyển về 0-based index
          const answer = question.answer.toUpperCase()
          
          return (
            <div key={index} className="relative">
              <div className="font-medium mb-2">
                Câu {index + 1}: {question.question}
              </div>
              <div className="flex items-center space-x-1">
                {answer.split("").map((letter, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 border-2 flex items-center justify-center font-medium
                      ${i === letterPosition 
                        ? "border-indigo-500 bg-indigo-50 text-indigo-600" 
                        : "border-gray-300"}`}
                  >
                    {letter}
                  </div>
                ))}
                {letterPosition >= answer.length && (
                  <span className="text-red-500 ml-2">
                    ⚠️ Vị trí chữ cái ({question.letterIndex}) vượt quá độ dài từ
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 