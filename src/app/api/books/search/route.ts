import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { GoogleBooksSearchQuerySchema } from "@/lib/validators"

export interface GoogleBookItem {
  googleBooksId: string
  title: string
  author: string
  year: number | null
  pages: number | null
  coverUrl: string | null
  alreadyInLibrary?: boolean
}

export async function GET(request: Request) {
  let user
  try {
    user = await getCurrentUser()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = GoogleBooksSearchQuerySchema.safeParse({
    q: searchParams.get("q"),
    startIndex: searchParams.get("startIndex") ?? 0,
    maxResults: searchParams.get("maxResults") ?? 10,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search query", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { q, startIndex, maxResults } = parsed.data
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY

  // Hybrid search: also search local books in user's library
  const localBooks = await db.book.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 5,
    select: {
      id: true,
      googleBooksId: true,
      title: true,
      author: true,
      year: true,
      pages: true,
      coverUrl: true,
    },
  })

  const localGoogleBookIds = new Set(
    localBooks.map((b) => b.googleBooksId).filter(Boolean) as string[],
  )

  let googleItems: GoogleBookItem[] = []
  let totalItems = 0

  try {
    const googleUrl = new URL("https://www.googleapis.com/books/v1/volumes")
    googleUrl.searchParams.set("q", q)
    googleUrl.searchParams.set("startIndex", String(startIndex))
    googleUrl.searchParams.set("maxResults", String(maxResults))
    if (apiKey) {
      googleUrl.searchParams.set("key", apiKey)
    }

    const res = await fetch(googleUrl.toString(), {
      next: { revalidate: 3600 },
    })

    if (res.ok) {
      const data = await res.json()
      totalItems = data.totalItems ?? 0
      if (Array.isArray(data.items)) {
        googleItems = data.items.map((item: any) => {
          const volumeInfo = item.volumeInfo || {}
          const rawYear = volumeInfo.publishedDate
            ? parseInt(volumeInfo.publishedDate.slice(0, 4), 10)
            : null
          const thumbnail =
            volumeInfo.imageLinks?.thumbnail ||
            volumeInfo.imageLinks?.smallThumbnail ||
            null
          const secureCoverUrl = thumbnail
            ? thumbnail.replace(/^http:\/\//i, "https://")
            : null

          return {
            googleBooksId: item.id,
            title: volumeInfo.title || "Sem título",
            author: Array.isArray(volumeInfo.authors)
              ? volumeInfo.authors.join(", ")
              : "Autor desconhecido",
            year: Number.isInteger(rawYear) ? rawYear : null,
            pages: Number.isInteger(volumeInfo.pageCount)
              ? volumeInfo.pageCount
              : null,
            coverUrl: secureCoverUrl,
            alreadyInLibrary: localGoogleBookIds.has(item.id),
          }
        })
      }
    }
  } catch (err) {
    console.error("Google Books search error:", err)
  }

  return NextResponse.json({
    localBooks: startIndex === 0 ? localBooks : [],
    items: googleItems,
    totalItems,
    startIndex,
    maxResults,
  })
}
