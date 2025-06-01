"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import CrosswordForm from "./CrosswordForm"

interface Game {
  id?: string
  name: string
  description: string
  type: "multiple_choice" | "crossword_basic" | "crossword_advanced"
}

interface GameFormProps {
  initialData?: Game
}

export default function GameForm({ initialData }: GameFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Game>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || "multiple_choice",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gameId, setGameId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/games${initialData?.id ? `/${initialData.id}` : ""}`, {
        method: initialData?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || "Có lỗi xảy ra khi lưu game")
      }

      const game = await response.json()
      
      // Nếu là game mới và không phải crossword, chuyển đến trang game
      if (!initialData?.id && !formData.type.startsWith("crossword_")) {
        router.push(`/games/${game.id}`)
        router.refresh()
      } else {
        // Nếu là crossword, lưu gameId để hiển thị form tạo quiz
        setGameId(game.id)
      }
    } catch (error) {
      console.error("Error saving game:", error)
      setError(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu game")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Nếu đã có gameId và là crossword game, hiển thị form tạo quiz
  if (gameId && formData.type.startsWith("crossword_")) {
    return (
      <div className="space-y-8">
        <div className="bg-green-50 text-green-700 p-4 rounded-md">
          Game đã được tạo thành công! Hãy tạo quiz đầu tiên cho game.
        </div>
        <CrosswordForm
          gameId={gameId}
          type={formData.type as "crossword_basic" | "crossword_advanced"}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Tên Game
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Mô tả
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={3}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Loại Game
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as Game["type"] })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={!!initialData} // Không cho phép đổi loại game khi đang chỉnh sửa
        >
          <option value="multiple_choice">Multiple Choice Quiz</option>
          <option value="crossword_basic">Crossword Puzzle - Basic (Vertical Word)</option>
          <option value="crossword_advanced">Crossword Puzzle - Advanced (Image Reveal)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isSubmitting ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isSubmitting ? "Đang lưu..." : initialData ? "Cập nhật" : "Tạo Game"}
      </button>
    </form>
  )
} 