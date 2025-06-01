"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface DeleteQuizButtonProps {
  quizId: string
}

export default function DeleteQuizButton({ quizId }: DeleteQuizButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa quiz này?")) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete quiz")
      }

      router.refresh()
    } catch (error) {
      alert("Có lỗi xảy ra khi xóa quiz. Vui lòng thử lại.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {isDeleting ? "Đang xóa..." : "Xóa"}
    </button>
  )
} 